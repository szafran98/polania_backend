import { playerCamera } from '../../camera';
import { bgCluster, game } from '../../../../app';
import Entity from './Entity';
import { IPlayer } from '../../../../Interfaces';
import * as SocketIO from 'socket.io';
import Group from './Group';
import { Equipment } from './Equipment';
import { getRepository } from 'typeorm';
import OwnedItem from '../../../backend/entity/OwnedItem';
import { ObjectID } from 'mongodb';
import { Class } from '../../Enums';

export default class Player extends Entity implements IPlayer {
    // POCZĄTKOWE WARTOŚCI INSTANCJI PLAYER
    hasMoved: boolean = false;
    currentDirection: number;
    lastDirection: number = 0;
    frameCount: number = 0;
    currentLoopIndex: number = 0;
    maxSpeed: number = 2;
    socketId: string;
    pressingRight: boolean = false;
    pressingLeft: boolean = false;
    pressingUp: boolean = false;
    pressingDown: boolean = false;
    imageSrc: string;

    isPlayerCollided = false;
    gold: number;
    class: Class;

    isContinousMoving = false;

    hasMapData = false;

    // equipment: Equipment;
    constructor(data: any) {
        super(data);
        this.currentDirection = data.currentDirection;
        this.socketId = data.socketId;
        this.imageSrc = data.imageSrc;
        this.gold = data.gold;
        this.class = data.class;

        console.log(data);
        this.getPlayerOwnedItemsData(data.ownedItemsIds).then((res: any[]) => {
            this.statistics.equipment = new Equipment(res);
            this.statistics.maxHealth = this.statistics.calculateMaxHealth();
        });

        this.moveDataFromClusterListener();
    }

    get group(): Group {
        return <Group>game.PLAYERS_GROUPS.find((group) => {
            return group.members.find((player) => {
                if (player.id === this.id) {
                    return player;
                } else {
                    return undefined;
                }
            });
        });
    }

    get mapData() {
        return game.map.mapDataToEmit;
    }

    get playerSocket(): SocketIO.Socket {
        return <SocketIO.Socket>(
            game.SOCKETS_LIST.find((socket) => socket.id === this.socketId)
        );
    }

    get experience(): number {
        return this.statistics._experience;
    }

    moveOnPath(pathData: string[]) {
        let directions = {
            right: 2,
            left: 1,
            up: 3,
            down: 0,
        };
        let i = 0;
        let pathIndex = 0;
        const moveInterval = setInterval(() => {
            if (typeof pathData[pathIndex] === 'undefined') {
                clearInterval(moveInterval);
                this.hasMoved = false;
            } else {
                if (i === 0) {
                    this.hasMoved = true;
                    if (pathData[pathIndex] === 'right')
                        this.currentDirection = 2;
                    if (pathData[pathIndex] === 'left')
                        this.currentDirection = 1;
                    if (pathData[pathIndex] === 'down')
                        this.currentDirection = 0;
                    if (pathData[pathIndex] === 'up') this.currentDirection = 3;

                    //console.log(pathData[pathIndex]);
                    this.moveByTile(directions[pathData[pathIndex]]);
                    pathIndex++;
                }
                i += 4;
                if (i === 32) {
                    i = 0;
                }
            }
        }, 1000 / 25);
    }

    promoteToNextLevel() {
        this.statistics._level++;
        this.statistics._experience = 0;
    }

    addExperience(expValue: number) {
        let expAfterCalculations = this.statistics._experience + expValue;
        let expToNextLevel =
            game.expToLevelTable[String(this.statistics._level + 1)];

        console.log(expAfterCalculations, expToNextLevel);
        if (expAfterCalculations >= expToNextLevel) {
            this.promoteToNextLevel();
            let expPassedToNextLevel = expAfterCalculations - expToNextLevel;
            this.statistics._experience += expPassedToNextLevel;
        } else {
            this.statistics._experience += expValue;
        }

        //this.statistics._experience += expValue;
        console.log(this.statistics._experience);
        console.log('actual exp');
    }

    async getPlayerOwnedItemsData(ownedItemsIds: string[]) {
        console.log(ownedItemsIds);

        const idsToQuery = [];
        ownedItemsIds.forEach((id) => {
            idsToQuery.push(ObjectID(id));
        });

        // const manager = getMongoManager();
        const repository = getRepository(OwnedItem);
        const items = await repository.findByIds(idsToQuery);

        return items;
    }

    coordinatesNormalizer() {
        while (this.y % 32 !== 0) {
            this.y++;
        }
        while (this.x % 32 !== 0) {
            this.x++;
        }
        /*
        if (this.x % 32 === 0 && this.y % 32 === 0) {
        } else {
            while (this.y % 32 !== 0) {
                this.y++;
            }
            while (this.x % 32 !== 0) {
                this.x++;
            }
        }

         */
    }

    // UPDATE PLAYER POSITION
    updatePosition(): void {
        if (this.pressingRight && this.x % 32 === 0 && this.y % 32 === 0) {
            this.currentDirection = 2;
            this.moveByTile(this.currentDirection);
        } else if (
            this.pressingLeft &&
            this.x % 32 === 0 &&
            this.y % 32 === 0
        ) {
            this.currentDirection = 1;
            this.moveByTile(this.currentDirection);
        } else if (this.pressingUp && this.y % 32 === 0 && this.x % 32 === 0) {
            this.currentDirection = 3;
            this.moveByTile(this.currentDirection);
        } else if (
            this.pressingDown &&
            this.y % 32 === 0 &&
            this.x % 32 === 0
        ) {
            this.currentDirection = 0;
            this.moveByTile(this.currentDirection);
        }

        /*
        // CHARACTER ANIMATION COUNTER
        if (this.frameCount >= 32) {
            this.frameCount = 0;
            this.currentLoopIndex += 1;
        }

        if (this.currentLoopIndex >= 4) {
            this.currentLoopIndex = 0;
        }

         */
    }

    keyPressListener(): void {
        // RECIVING MOVE KEYS
        this.playerSocket.on(
            'keyPress',
            (data: { inputId: string; state: boolean }) => {
                if (data.inputId === 'left') {
                    this.pressingLeft = data.state;
                } else if (data.inputId === 'right') {
                    this.pressingRight = data.state;
                } else if (data.inputId === 'down') {
                    this.pressingDown = data.state;
                } else if (data.inputId === 'up') {
                    this.pressingUp = data.state;
                }
                if (data.state === true) {
                    this.hasMoved = true;
                    this.updatePosition();
                }
                //bgCluster.send(this);

                //console.log('krok');
                //if (this.hasMoved) return;

                //console.log(data.state);
                //this.updatePosition();
            }
        );
    }

    onDisconnect(): void {
        for (const i in game.SOCKETS_LIST) {
            game.SOCKETS_LIST[i].emit('playerDisconnected', this.socketId);
        }
        game.SOCKETS_LIST = game.SOCKETS_LIST.filter((socket) => {
            return socket !== this.playerSocket;
        });
        game.PLAYERS_LIST = game.PLAYERS_LIST.filter((player) => {
            return player !== this;
        });
    }

    // PLAYER MOVE
    moveByTile(direction: number): void {
        /*
        console.log('move by tile');
        console.log(
            this.pressingLeft,
            this.pressingRight,
            this.pressingDown,
            this.pressingUp
        );

         */
        //if (this.hasMoved) return;

        if (this.checkCollisions()) {
            return;
        }
        this.checkCollisionsWithPlayers();

        if (!this.isPlayerCollided) {
            let move = 0;

            //this.hasMoved = true;

            bgCluster.send(this);

            /*
            playerCamera(
                direction,
                this.x,
                this.y,
                this.playerSocket,
                this.mapData
            );

             */

            /*
            const moveTimer = setInterval(() => {
                this.hasMoved = true;

                if (direction === 2) {
                    this.x += this.maxSpeed;
                } else if (direction === 1) {
                    this.x -= this.maxSpeed;
                } else if (direction === 3) {
                    this.y -= this.maxSpeed;
                } else if (direction === 0) {
                    this.y += this.maxSpeed;
                }
                this.frameCount += 16;
                move += 4;
                if (move % 32 === 0) {
                    clearInterval(moveTimer);
                    this.currentLoopIndex = 0;
                    this.frameCount = 0;
                    this.hasMoved = false;
                }
            }, 1000 / 16);

             */
        }
    }

    moveDataFromClusterListener() {
        bgCluster.on('message', (newPlayerData: IPlayer) => {
            //console.log(newPlayerData.isContinousMoving);
            /*
            console.log(
                newPlayerData.currentLoopIndex,
                newPlayerData.hasMoved,
                newPlayerData.isContinousMoving
            );

             */

            this.x = newPlayerData.x;
            this.y = newPlayerData.y;
            this.frameCount = newPlayerData.frameCount;
            this.currentLoopIndex = newPlayerData.currentLoopIndex;
            this.hasMoved = newPlayerData.hasMoved;
            this.isContinousMoving = newPlayerData.isContinousMoving;

            if (!this.hasMoved) {
                this.setPlayerStopped(this.x, this.y);
                //this.currentLoopIndex = 0;
                //this.frameCount = 0;
            }
        });
    }

    setPlayerStopped(playerX, playerY) {
        let x = playerX;
        let y = playerY;

        setTimeout(() => {
            if (x === this.x && y === this.y) {
                this.currentLoopIndex = 0;
                this.frameCount = 0;
            }
        }, 100);
    }

    // TERRAIN COLLISIONS
    checkCollisions(): boolean {
        // MAP BORDERS
        if (
            (this.x === 0 && this.currentDirection === 1) ||
            (this.x + 32 === this.mapData.world.width * 32 &&
                this.currentDirection === 2) ||
            (this.y === 0 && this.currentDirection === 3) ||
            (this.y + 32 === this.mapData.world.height * 32 &&
                this.currentDirection === 0)
        ) {
            this.onCollision();
            return true;
        }

        let isColliding = false;

        for (const collider in game.map.collisionMap) {
            if (
                this.x + 32 === game.map.collisionMap[collider].x1 &&
                this.currentDirection === 2 &&
                this.y === game.map.collisionMap[collider].y1
            ) {
                //console.log('from left collision');
                // this.onCollision();
                isColliding = true;
                break;
            } else if (
                this.x === game.map.collisionMap[collider].x2 &&
                this.currentDirection === 1 &&
                this.y === game.map.collisionMap[collider].y1
            ) {
                // FROM RIGHT SIDE
                // this.onCollision();
                isColliding = true;
                break;
            } else if (
                this.y + 32 === game.map.collisionMap[collider].y1 &&
                this.currentDirection === 0 &&
                this.x === game.map.collisionMap[collider].x1
            ) {
                // FROM TOP SIDE
                // this.onCollision();
                isColliding = true;
                break;
            } else if (
                this.y === game.map.collisionMap[collider].y2 &&
                this.currentDirection === 3 &&
                this.x === game.map.collisionMap[collider].x1
            ) {
                // FROM DOWN SIDE
                // this.onCollision();
                isColliding = true;
                break;
            }
        }

        if (isColliding) {
            this.onCollision();
        } else {
            this.maxSpeed = 2;
            this.isPlayerCollided = false;
        }

        return isColliding;
    }

    // PLAYERS COLLISION
    checkCollisionsWithPlayers(): void {
        for (const i in game.PLAYERS_LIST) {
            if (game.PLAYERS_LIST[i].id !== this.id) {
                if (
                    this.x + 32 === game.PLAYERS_LIST[i].x &&
                    this.currentDirection === 2 &&
                    this.y === game.PLAYERS_LIST[i].y
                ) {
                    // FROM LEFT SIDE
                    this.onCollision();
                } else if (
                    this.x === game.PLAYERS_LIST[i].x + 32 &&
                    this.currentDirection === 1 &&
                    this.y === game.PLAYERS_LIST[i].y
                ) {
                    // FROM RIGHT SIDE
                    this.onCollision();
                } else if (
                    this.y + 32 === game.PLAYERS_LIST[i].y &&
                    this.currentDirection === 0 &&
                    this.x === game.PLAYERS_LIST[i].x
                ) {
                    // FROM TOP SIDE
                    this.onCollision();
                } else if (
                    this.y === game.PLAYERS_LIST[i].y + 32 &&
                    this.currentDirection === 3 &&
                    this.x === game.PLAYERS_LIST[i].x
                ) {
                    // FROM DOWN SIDE
                    this.onCollision();
                }
            }
        }
    }

    onCollision(): void {
        this.maxSpeed = 0;
        this.isPlayerCollided = true;
        this.lastDirection = this.currentDirection;
        this.currentLoopIndex = 0;
        this.frameCount = 0;
    }

    static update(): Player[] {
        const pack: Player[] = [];
        // console.log('player update')

        for (const i in game.PLAYERS_LIST) {
            const player = game.PLAYERS_LIST[i];
            player.updatePosition();
            pack.push(player);

            // console.log(player.statistics.equipment);
        }
        return pack;
    }
}
