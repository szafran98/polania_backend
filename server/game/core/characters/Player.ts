import { playerCamera } from '../../camera';
import { game } from '../../../../app';
import Entity from './Entity';
import { IPlayer } from '../../../../Interfaces';
import * as SocketIO from 'socket.io';
import Group from './Group';
import { Equipment } from './Equipment';
import { getMongoManager, getRepository } from 'typeorm';
import OwnedItem from '../../../backend/entity/OwnedItem';
import { ObjectID } from 'mongodb';

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

    //equipment: Equipment;
    constructor(data: any) {
        super(data);
        this.currentDirection = data.currentDirection;
        this.socketId = data.socketId;
        this.imageSrc = data.imageSrc;
        this.gold = data.gold;

        console.log(data);
        this.getPlayerOwnedItemsData(data.ownedItemsIds).then((res: any[]) => {
            this.statistics.equipment = new Equipment(res);
            this.statistics.maxHealth = this.statistics.calculateMaxHealth();
        });
    }

    get group(): Group {
        return <Group>game.PLAYERS_GROUPS.find((group) => {
            group.members.find((player) => player.id === this.id);
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

    async getPlayerOwnedItemsData(ownedItemsIds: string[]) {
        console.log(ownedItemsIds);

        let idsToQuery = [];
        ownedItemsIds.forEach((id) => {
            idsToQuery.push(ObjectID(id));
        });

        const manager = getMongoManager();
        const repository = getRepository(OwnedItem);
        const items = await repository.findByIds(idsToQuery);

        return items;

    }

    coordinatesNormalizer() {
        if (this.x % 32 === 0 && this.y % 32 === 0) {
            return;
        } else {
            while (this.y % 32 !== 0) {
                this.y++;
            }
            while (this.x % 32 !== 0) {
                this.x++;
            }
        }
    }

    //UPDATE PLAYER POSITION
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

        //CHARACTER ANIMATION COUNTER
        if (this.frameCount >= 32) {
            this.frameCount = 0;
            this.currentLoopIndex += 1;
        }

        if (this.currentLoopIndex >= 4) {
            this.currentLoopIndex = 0;
        }
    }

    keyPressListener(): void {
        //RECIVING MOVE KEYS
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
            }
        );
    }

    onDisconnect(): void {
        for (let i in game.SOCKETS_LIST) {
            game.SOCKETS_LIST[i].emit('playerDisconnected', this.socketId);
        }
        game.SOCKETS_LIST = game.SOCKETS_LIST.filter((socket) => {
            return socket !== this.playerSocket;
        });
        game.PLAYERS_LIST = game.PLAYERS_LIST.filter((player) => {
            return player !== this;
        });
    }

    //PLAYER MOVE
    moveByTile(direction: number): void {
        if (this.checkCollisions()) {
            return;
        }
        this.checkCollisionsWithPlayers();

        if (!this.isPlayerCollided) {
            let move = 0;

            playerCamera(
                direction,
                this.x,
                this.y,
                this.playerSocket,
                this.mapData
            );

            let moveTimer = setInterval(() => {
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
                this.frameCount += 8;
                move += 2;
                if (move % 32 === 0) {
                    clearInterval(moveTimer);
                    this.currentLoopIndex = 0;
                    this.frameCount = 0;
                    this.hasMoved = false;
                }
            }, 1000 / 25);
        }
    }

    //TERRAIN COLLISIONS
    checkCollisions(): boolean {
        //MAP BORDERS
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

        for (let collider in game.map.collisionMap) {
            if (
                this.x + 32 === game.map.collisionMap[collider].x1 &&
                this.currentDirection === 2 &&
                this.y === game.map.collisionMap[collider].y1
            ) {
                console.log('from left collision');
                //this.onCollision();
                isColliding = true;
                break;
            }
            //FROM RIGHT SIDE
            else if (
                this.x === game.map.collisionMap[collider].x2 &&
                this.currentDirection === 1 &&
                this.y === game.map.collisionMap[collider].y1
            ) {
                //this.onCollision();
                isColliding = true;
                break;
            }
            //FROM TOP SIDE
            else if (
                this.y + 32 === game.map.collisionMap[collider].y1 &&
                this.currentDirection === 0 &&
                this.x === game.map.collisionMap[collider].x1
            ) {
                //this.onCollision();
                isColliding = true;
                break;
            }
            //FROM DOWN SIDE
            else if (
                this.y === game.map.collisionMap[collider].y2 &&
                this.currentDirection === 3 &&
                this.x === game.map.collisionMap[collider].x1
            ) {
                //this.onCollision();
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

    //PLAYERS COLLISION
    checkCollisionsWithPlayers(): void {
        for (let i in game.PLAYERS_LIST) {
            if (game.PLAYERS_LIST[i].id !== this.id) {
                //FROM LEFT SIDE
                if (
                    this.x + 32 === game.PLAYERS_LIST[i].x &&
                    this.currentDirection === 2 &&
                    this.y === game.PLAYERS_LIST[i].y
                ) {
                    this.onCollision();
                }
                //FROM RIGHT SIDE
                else if (
                    this.x === game.PLAYERS_LIST[i].x + 32 &&
                    this.currentDirection === 1 &&
                    this.y === game.PLAYERS_LIST[i].y
                ) {
                    this.onCollision();
                }
                //FROM TOP SIDE
                else if (
                    this.y + 32 === game.PLAYERS_LIST[i].y &&
                    this.currentDirection === 0 &&
                    this.x === game.PLAYERS_LIST[i].x
                ) {
                    this.onCollision();
                }
                //FROM DOWN SIDE
                else if (
                    this.y === game.PLAYERS_LIST[i].y + 32 &&
                    this.currentDirection === 3 &&
                    this.x === game.PLAYERS_LIST[i].x
                ) {
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
        let pack: Player[] = [];
        //console.log('player update')

        for (let i in game.PLAYERS_LIST) {
            let player = game.PLAYERS_LIST[i];
            player.updatePosition();
            pack.push(player);

            //console.log(player.statistics.equipment);
        }
        return pack;
    }
}
