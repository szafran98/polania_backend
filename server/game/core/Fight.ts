import Player from './characters/Player';
import Enemy from './characters/Enemy';
import { CombatType } from '../Enums';
import { game } from '../../../app';
import * as SocketIO from 'socket.io';

type Entity = Player | Enemy;

export interface IGridObject {
    coords: number[];
    entity: Entity;
}

export default class Fight {
    fightId = Math.random();
    type: CombatType;
    private _attackers!: Entity[];
    private _defenders!: Entity[];
    private activeEntityId: number = 0;
    private actualTurn: number = 1;
    private attackQueue: Entity[];
    private isPlayerTurnTimerRunning: boolean = false;

    actualGridPresentation?: IGridObject[][] = [];

    static gridFieldsCoords = [
        [
            [96, 224],
            [128, 224],
            [160, 224],
            [192, 224],
            [224, 224],
            [256, 224],
            [288, 224],
            [320, 224],
        ],
        [
            [96, 274],
            [128, 274],
            [160, 274],
            [192, 274],
            [224, 274],
            [256, 274],
            [288, 274],
            [320, 274],
        ],
        [
            [96, 324],
            [128, 324],
            [160, 324],
            [192, 324],
            [224, 324],
            [256, 324],
            [288, 324],
            [320, 324],
        ],
    ];

    constructor(attackers: Entity[], defenders: Entity[]) {
        this.attackers = attackers;
        this.defenders = defenders;
        this.type = this.setCombatType();

        this.attackQueue = this.createQueue();

        this.placeEntitiesOnGrid();

        this.doPlayerAttackListener();
        this.doPlayerMoveListener();
        this.playerLostTurnListener();

        this.initializeFightInClient();

        this.combatLoop();
    }

    private initializeFightInClient(): void {
        if (this.type === CombatType.PVE) {
            this.playersSockets.forEach((socket) => {
                socket.emit('beginCombat', this);
            });
        } else if (this.type === CombatType.PVP) {
            this.players.forEach((player) => {
                if (this.isPlayerPartOfAttackers(player)) {
                    player.playerSocket.emit('beginCombat', this);
                } else if (this.isPlayerPartOfDefenders(player)) {
                    player.playerSocket.emit('beginCombat', {
                        ...this,
                        _attackers: this.defenders,
                        _defenders: this.attackers,
                    });
                }
            });
        }
    }

    private playerLostTurnListener(): void {
        this.playersSockets.forEach((socket) => {
            socket.on('noPlayerAction', (fightId) => {
                if (fightId !== this.fightId) return;
                this.setActiveEntityAsNext();
            });
        });
    }

    get playersSockets(): SocketIO.Socket[] {
        const socketsList: SocketIO.Socket[] = [];
        this.attackers.concat(this.defenders).forEach((player) => {
            if (player instanceof Player) {
                socketsList.push(player.playerSocket);
            }
        });
        return socketsList;
    }

    get attackers(): Entity[] {
        return this._attackers;
    }

    set attackers(attackersList) {
        const attackers: Entity[] = [];
        attackersList.forEach((attacker) => {
            const attackerInstance = game.PLAYERS_LIST.find(
                (player) => player.id === attacker.id
            );
            if (attackerInstance) {
                attackers.push(attackerInstance);
            }
        });
        this._attackers = attackers;
    }

    get defenders(): Entity[] {
        return this._defenders;
    }

    set defenders(defendersList) {
        const defenders: Entity[] = [];
        defendersList.forEach((defender) => {
            // JEŚLI PRZECIWNIK GRACZ
            const defenderInstance = game.PLAYERS_LIST.find(
                (player) => player.id === defender.id
            );
            if (defenderInstance) {
                defenders.push(defenderInstance);
            } else {
                const defenderInstance = <Enemy>(
                    game.map.enemiesOnMap.find(
                        (enemy) => enemy.id === defender.id
                    )
                );
                defenderInstance.statistics.health =
                    defenderInstance.statistics.maxHealth;
                defenders.push(defenderInstance);
            }
        });
        this._defenders = defenders;
    }

    get computerEnemies(): Enemy[] {
        const enemies: Enemy[] = [];
        this.defenders.forEach((entity) => {
            if (entity instanceof Enemy) {
                enemies.push(entity);
            }
        });
        return enemies;
    }

    get killedEnemies(): Enemy[] {
        const killedEnemies: Enemy[] = [];
        this.computerEnemies.forEach((enemy) => {
            if (enemy.statistics.health <= 0) {
                killedEnemies.push(enemy);
            }
        });
        return killedEnemies;
    }

    get players(): Player[] {
        const playersList: Player[] = [];
        this.attackQueue.forEach((entity) => {
            if (entity instanceof Player) playersList.push(entity);
        });
        return playersList;
    }

    get activeEntity(): Entity {
        return this.attackQueue[this.activeEntityId];
    }

    get winingTeam() {
        let attackers: Entity[] = [];
        let defenders = [];
        this.attackQueue.forEach((entity) => {
            let getInstanceIfEntityLive = this.attackers.find(
                (attacker) => attacker === entity
            );
            if (getInstanceIfEntityLive) {
                attackers.push(getInstanceIfEntityLive);
            } else {
                getInstanceIfEntityLive = this.defenders.find(
                    (defender) => defender === entity
                );
                if (getInstanceIfEntityLive) {
                    defenders.push(getInstanceIfEntityLive);
                }
            }
        });
        if (attackers.length === 0) {
            return 'defenders';
        }
        if (defenders.length === 0) {
            return 'attackers';
        }

        /*
        if (this.attackers.length === 0) {
            return 'defenders';
        }
        if (this.defenders.length === 0) {
            return 'attackers';
        }

         */
    }

    isPlayerPartOfAttackers(player: Player) {
        const playerInstance = this.attackers.find(
            (playerInstance) => playerInstance === player
        );
        return !!playerInstance;
    }

    isPlayerPartOfDefenders(player: Player) {
        const playerInstance = this.defenders.find(
            (playerInstance) => playerInstance === player
        );
        return !!playerInstance;
    }

    setCombatType(): CombatType {
        if (this.computerEnemies.length === 0) {
            return CombatType.PVP;
        } else {
            return CombatType.PVE;
        }
    }

    createQueue(): Entity[] {
        const allEntities: Entity[] = this.attackers.concat(this.defenders);
        allEntities.sort((a, b) => {
            return a.statistics.AT - b.statistics.AT;
        });
        return allEntities;
    }

    placeEntitiesOnGrid(): void {
        const attackersLayer = 2;
        const defendersLayer = 0;
        const placeInLayerOrder = [4, 3, 5, 2, 6, 1, 7, 0];

        for (let i = 0; i < 3; i++) {
            this.actualGridPresentation.push(new Array(8).fill({}));
        }

        for (let w = 0; w < this.attackers.length; w++) {
            const attackerPosCoords =
                Fight.gridFieldsCoords[attackersLayer][placeInLayerOrder[w]];

            const gridObject: IGridObject = {
                coords: attackerPosCoords,
                entity: this.attackers[w],
            };

            for (let i = 0; i < 3; i++) {
                if (i === attackersLayer) {
                    this.actualGridPresentation[i][
                        placeInLayerOrder[w]
                    ] = gridObject;
                }
            }
        }

        for (let w = 0; w < this.defenders.length; w++) {
            const attackerPosCoords =
                Fight.gridFieldsCoords[defendersLayer][placeInLayerOrder[w]];

            const gridObject = {
                coords: attackerPosCoords,
                entity: this.defenders[w],
            };

            for (let i = 0; i < 3; i++) {
                if (i === defendersLayer) {
                    this.actualGridPresentation[i][
                        placeInLayerOrder[w]
                    ] = gridObject;
                }
            }
        }
        console.log(this.actualGridPresentation);
    }

    // DO POPRAWIENIA
    isEnemyInRange(attacker: Entity, defender: Entity): boolean {
        // let attackerObjectInGrid, defenderObjectInGrid

        let attackerLayer, defenderLayer;
        for (let i = 0; i < this.actualGridPresentation.length; i++) {
            this.actualGridPresentation[i].forEach((field: IGridObject) => {
                if (
                    Object.prototype.hasOwnProperty.call(field, 'entity') &&
                    (field.entity.id === attacker.id ||
                        field.entity.id === defender.id)
                ) {
                    if (field.entity === attacker) {
                        // attackerObjectInGrid = field;
                        attackerLayer = i;
                    } else if (field.entity === defender) {
                        // defenderObjectInGrid = field;
                        defenderLayer = i;
                    }
                }
            });
        }

        return (
            Math.abs(defenderLayer - attackerLayer) === 1 ||
            Math.abs(defenderLayer - attackerLayer) === 0
        );
    }

    isTurnEnded(): boolean {
        return this.activeEntityId + 1 === this.attackQueue.length;
    }

    combatLoop(): void {
        this.doComputerEnemyMoveIfPossible();

        if (this.isFightEnded()) {
            return;
        }

        if (this.type === CombatType.PVE) {
            this.playersSockets.forEach((socket) => {
                socket.emit('updateFight', this);
            });
        } else if (this.type === CombatType.PVP) {
            this.players.forEach((player) => {
                if (this.isPlayerPartOfAttackers(player)) {
                    player.playerSocket.emit('updateFight', this);
                } else if (this.isPlayerPartOfDefenders(player)) {
                    player.playerSocket.emit('updateFight', {
                        ...this,
                        _attackers: this.defenders,
                        _defenders: this.attackers,
                    });
                }
            });
        }
    }

    doComputerEnemyMoveIfPossible(): void {
        if (this.activeEntity instanceof Enemy) {
            // WYBIERZ CEL ATAKU
            this.activeEntity.chooseTarget(this.attackers);
            // SPRAWDŹ CZY PRZECIWNIK JEST W ZASIĘGU
            if (
                this.isEnemyInRange(
                    this.activeEntity,
                    <Entity>this.activeEntity.target
                )
            ) {
                // ZAATAKUJ PRZECIWNIKA
                this.emitFightLogData(
                    this.activeEntity,
                    this.activeEntity.attack(this.activeEntity.target)
                );
            } else {
                // JEŚLI NIE, WYKONAJ KROK DO PRZODU

                this.activeEntity.moveForward();

                /*
                if (this.activeEntity.moveForward()) {
                    this.playersSockets.forEach((socket) => {
                        socket.emit('entityMoved', this.activeEntity);
                    });
                }

                 */
                // this.activeEntity.moveForward();
            }
            this.setActiveEntityAsNext();
        }
    }

    doPlayerAttackListener(): void {
        this.playersSockets.forEach((socket) => {
            socket.on('playerAttack', (data: any) => {
                if (data.fightId !== this.fightId) return;

                const attackTarget = <Entity>(
                    this.attackQueue.find(
                        (entity) => entity.id === data.target.id
                    )
                );
                this.emitFightLogData(
                    this.activeEntity,
                    this.activeEntity.attack(attackTarget)
                );

                this.isPlayerTurnTimerRunning = false;
                this.setActiveEntityAsNext();
            });
        });
    }

    doPlayerMoveListener(): void {
        this.playersSockets.forEach((socket) => {
            socket.on('playerMove', (data: any) => {
                if (data.fightId !== this.fightId) return;

                if (this.activeEntity.moveForward()) {
                    this.isPlayerTurnTimerRunning = false;
                    this.setActiveEntityAsNext();
                }
            });
        });
    }

    setActiveEntityAsNext(): void {
        this.removeDiedEntities();
        if (this.isTurnEnded()) {
            this.activeEntityId = 0;
            this.actualTurn++;
        } else {
            let actualActiveEntityId = this.activeEntityId;
            if (actualActiveEntityId++ >= this.attackQueue.length) {
                this.activeEntityId = 0;
                this.actualTurn++;
            } else {
                this.activeEntityId++;
            }
        }

        if (this.isFightEnded()) {
            return;
        }

        this.combatLoop();
    }

    removeDiedEntities(): void {
        this.attackQueue = this.attackQueue.filter((entity) => {
            if (entity.statistics.health > 0) {
                return entity;
            } else {
                return undefined;
            }
        });
        /*
        this.attackers = this.attackers.filter((entity) => {
            if (entity.statistics.health > 0) {
                return entity;
            } else {
                return undefined;
            }
        });
        this.defenders = this.defenders.filter((entity) => {
            if (entity.statistics.health > 0) {
                return entity;
            } else {
                return undefined;
            }
        });

         */
    }

    isFightEnded(): boolean {
        const livingAttackers = [];
        this.attackers.forEach((attacker) => {
            if (attacker.statistics.health > 0) {
                livingAttackers.push(attacker);
            }
        });

        if (livingAttackers.length === 0) {
            console.log('przeciwnicy wygrali');
            this.exitFight();
            return true;
        }

        const livingDefenders = [];
        this.defenders.forEach((defender) => {
            if (defender.statistics.health > 0) {
                livingDefenders.push(defender);
            }
        });

        if (livingDefenders.length === 0) {
            console.log('wygrałeś walkę');
            this.exitFight();
            return true;
        }

        return false;
    }

    exitFight(): void {
        this.playersSockets.forEach((socket) => {
            socket.emit('combatEnded');
        });

        game.map.removeKilledEnemiesFromMap(this.killedEnemies);
        this.addExperienceForPveFight();

        this._attackers = [];
        this._defenders = [];
        this.attackQueue = [];

        game.ACTUAL_COMBATS_LIST = game.ACTUAL_COMBATS_LIST.filter(
            (combat: this) => {
                if (combat !== this) {
                    return combat;
                } else {
                    return undefined;
                }
            }
        );
    }

    emitFightLogData(who: Entity, damage: number): void {
        this.playersSockets.forEach((socket) => {
            socket.emit('fightLogData', {
                name: who.name,
                damage: damage,
                fightId: this.fightId,
            });
        });
    }

    addExperienceForPveFight() {
        console.log(
            this.type === CombatType.PVE,
            this.winingTeam === 'attackers',
            this.attackers,
            this.defenders
        );
        if (this.type === CombatType.PVE && this.winingTeam === 'attackers') {
            let enemiesExpRewardSum = 0;

            this.computerEnemies.forEach((enemy) => {
                enemiesExpRewardSum += enemy.statistics._experience;
            });
            let rewardForEachPlayer = enemiesExpRewardSum / this.players.length;

            this.players.forEach((player) => {
                player.addExperience(rewardForEachPlayer);
            });
        }
    }
}
