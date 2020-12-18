import Fight from './Fight';
import {
    Connection,
    createConnection,
    getConnection,
    getMongoManager,
    getRepository,
} from 'typeorm';
import axios from 'axios';
import { ObjectID } from 'mongodb';
const SocketIO = require('socket.io');
import Player from './characters/Player';
import Map from './Map';
import Group from './characters/Group';
import Character from '../../backend/entity/Character';
import { IOwnedItem } from '../../../Interfaces';
import Trade from './characters/Trade';

export default class GameServer {
    SOCKETS_LIST: SocketIO.Socket[] = [];
    PLAYERS_LIST: Player[] = [];
    ACTUAL_COMBATS_LIST: Fight[] = [];
    ACTUAL_TRADES_LIST: Trade[] = [];
    PLAYERS_GROUPS: Group[] = [];
    socketio: SocketIO.Server;
    map!: Map;
    dbConnection!: Connection;

    //ITEMS_ON_GROUND: any[] = [];

    constructor(socket: SocketIO.Server) {
        this.socketio = socket;
        this.createDatabaseConnection().then(() => {
            this.map = new Map();
            this.connectionHandler();
            this.emitGameData();
        });
    }

    async createDatabaseConnection(): Promise<void> {
        this.dbConnection = await createConnection();
    }

    async getDatabaseConnection(): Promise<Connection> {
        return getConnection();
    }

    // METODA OBSŁUGUJĄCA WSZYSTKIE POŁĄCZENIA WYCHODZĄCE I PRZYCHODZĄCE Z GRACZEM
    connectionHandler(): void {
        this.socketio.on('connect', async (socket) => {
            console.log('player connected');
            socket.on('loginOnCharacter', async (loginData) => {
                //console.log(loginData.character.name);

                await axios
                    .post(
                        'http://localhost:2000/character/selectedCharacter',
                        {
                            characterName: loginData.character.name,
                        },
                        {
                            headers: {
                                auth: loginData.token,
                            },
                        }
                    )
                    .then((res) => {
                        let character = res.data;
                        character.socketId = socket.id;

                        let isActualyLogged = false;

                        for (let i in this.PLAYERS_LIST) {
                            if (this.PLAYERS_LIST[i].id === character.id) {
                                isActualyLogged = true;
                                socket.disconnect();
                            }
                        }

                        if (!isActualyLogged) {
                            console.log(character)
                            console.log('character db data ^^^^^^^^')
                            let player = new Player(character);

                            this.PLAYERS_LIST.push(player);
                            this.SOCKETS_LIST.push(socket);

                            console.log(this.PLAYERS_LIST.length);
                            console.log(this.SOCKETS_LIST.length);

                            player.keyPressListener();

                            this.combat(socket);
                            this.playerCollided(socket, player);
                            this.addToGroup(socket, player);
                            this.messageHandler(socket, player);
                            this.socketDisconnect(socket, player);
                            this.dragItem(socket, player);
                            this.getItemFromGround(socket, player);
                            this.requestTradeWithPlayer(socket, player);
                            this.abortTrade(socket, player)
                            //this.dumpCharacterStateToDb(player);
                        }

                        /*
                        let tokens = res.data.split('.');

                        let middlePayload = JSON.parse(
                            Buffer.from(tokens[1], 'base64').toString('ascii')
                        );

                         */
                        /*
                        let playerData = { id: 'dss', socketId: 'dssd' };

                        //playerData.id = middlePayload.userId;
                        //playerData.socketId = socket.id;

                        let isActualyLogged = false;

                        for (let i in this.PLAYERS_LIST) {
                            if (this.PLAYERS_LIST[i].id === playerData.id) {
                                isActualyLogged = true;
                                socket.disconnect();
                            }
                        }

                        if (!isActualyLogged) {
                            let player = new Player(playerData);

                            this.PLAYERS_LIST.push(player);
                            this.SOCKETS_LIST.push(socket);

                            player.keyPressListener();

                            this.combat(socket);
                            this.playerCollided(socket, player);
                            this.addToGroup(socket, player);
                            this.messageHandler(socket, player);
                            this.socketDisconnect(socket, player);

                            socket.on('setPlayerName', (data: any) => {
                                player.name = data;
                            });
                        }

                         */
                    });
            });
        });
    }

    abortTrade(socket: SocketIO.Socket, player: Player) {
        socket.on('tradeAborted', (tradeId: number) => {
            let trade = this.ACTUAL_TRADES_LIST.find(trade => trade.id === tradeId)

            trade.player1.instance.playerSocket.emit('tradeCompleted')
            trade.player2.instance.playerSocket.emit('tradeCompleted')

            trade.player1 = null
            trade.player2 = null
            this.ACTUAL_TRADES_LIST = this.ACTUAL_TRADES_LIST.filter(tradeInstance => {
                if (tradeInstance.id !== trade.id) {
                    return tradeInstance
                }
            })
        })
    }

    requestTradeWithPlayer(socket: SocketIO.Socket, player: Player) {
        socket.on('requestTradeWithPlayer', (playerId: string) => {
            let requestedPlayerInstance = this.PLAYERS_LIST.find(
                (playerInstance) => playerInstance.id === playerId
            );

            if (requestedPlayerInstance) {
                requestedPlayerInstance.playerSocket.emit(
                    'askPlayerForTrade',
                    player.name
                );

                requestedPlayerInstance.playerSocket.on(
                    'tradeRequestAccepted',
                    () => {
                        console.log('hwdp');
                        this.ACTUAL_TRADES_LIST.push(
                            new Trade(player, requestedPlayerInstance)
                        );
                    }
                );
            }
        });
    }

    getItemFromGround(socket: SocketIO.Socket, player: Player) {
        socket.on('getItemFromGround', async (item) => {
            this.map.itemsOnMap = this.map.itemsOnMap.filter((itemInstance) => {
                return itemInstance.id !== item.id;
            });

            item.item.fieldInEquipment = `field${Math.floor(
                Math.random() * 42
            )}`;
            player.statistics.equipment.backpack.push(item.item);

            socket.emit('pickedUpItem', item.item);

            const manager = getMongoManager();
            await manager.updateOne(
                Character,
                {
                    _id: ObjectID(player.id),
                },
                {
                    $push: {
                        ownedItems: item.item,
                    },
                }
            );
        });

        //player.statistics.equipment.backpack.push(item.)
    }

    dragItem(socket: SocketIO.Socket, player: Player) {
        socket.on('dragItem', async (draggedItemData) => {
            console.log(draggedItemData);
            console.log('before dragged ^^^');

            // PRZENIESIENIE Z EKWIPUNKU DO PLECAKA
            if (
                !draggedItemData.actualField.includes('field') &&
                draggedItemData.destinationField.includes('field')
            ) {
                for (let i in player.statistics.equipment) {
                    if (
                        Array.isArray(player.statistics.equipment[i]) ||
                        player.statistics.equipment[i] === null
                    )
                        continue;
                    if (
                        player.statistics.equipment[i].fieldInEquipment ===
                        draggedItemData.actualField
                    ) {
                        let updatedItem = Object.assign(
                            {},
                            player.statistics.equipment[i]
                        );
                        updatedItem.fieldInEquipment =
                            draggedItemData.destinationField;
                        player.statistics.equipment.updateItemAfterDragging(
                            player.statistics.equipment[i],
                            updatedItem,
                            player
                        );
                        player.statistics.maxHealth = player.statistics.calculateMaxHealth();
                        console.log(player.statistics.allStatistics);
                        console.log('after dragged ^^^');
                    }
                }
            } else if (
                draggedItemData.actualField.includes('field') &&
                draggedItemData.destinationField.includes('field')
            ) {
                // PRZENIESIENIE Z PLECAKA DO PLECAKA
                console.log('case 2');
                for (let i in player.statistics.equipment) {
                    if (i === 'backpack') {
                        console.log('i = backpack');
                        for (let itemInBackpack in player.statistics.equipment[
                            i
                            ]) {
                            console.log(
                                player.statistics.equipment[i][itemInBackpack]
                                    .fieldInEquipment,
                                draggedItemData.actualField
                            );
                            if (
                                player.statistics.equipment[i][itemInBackpack]
                                    .fieldInEquipment ===
                                draggedItemData.actualField
                            ) {
                                let updatedObject = Object.assign(
                                    {},
                                    player.statistics.equipment[i][
                                        itemInBackpack
                                        ]
                                );
                                updatedObject.fieldInEquipment =
                                    draggedItemData.destinationField;

                                console.log('method run');
                                player.statistics.equipment.updateItemAfterDragging(
                                    player.statistics.equipment[i][
                                        itemInBackpack
                                        ],
                                    updatedObject,
                                    player
                                );
                                player.statistics.equipment[i][
                                    itemInBackpack
                                    ].fieldInEquipment =
                                    draggedItemData.destinationField;
                            }
                        }
                    }
                }
            } // PRZENIESIENIE Z PLECAKA DO EKWIPUNKU
            else if (
                !draggedItemData.destinationField.includes('field') &&
                draggedItemData.actualField.includes('field') &&
                !draggedItemData.destinationField.includes('ctx')
            ) {
                for (let i in player.statistics.equipment) {
                    if (i !== 'backpack') continue;
                    for (let itemInBackpack in player.statistics.equipment[i]) {
                        console.log(
                            player.statistics.equipment[i][itemInBackpack]
                        );
                        if (
                            player.statistics.equipment[i][itemInBackpack]
                                .fieldInEquipment ===
                            draggedItemData.actualField
                        ) {
                            let updatedObject = Object.assign(
                                {},
                                player.statistics.equipment[i][itemInBackpack]
                            );
                            updatedObject.fieldInEquipment =
                                draggedItemData.destinationField;

                            player.statistics.equipment.updateItemAfterDragging(
                                player.statistics.equipment[i][itemInBackpack],
                                updatedObject,
                                player
                            );
                            player.statistics.maxHealth = player.statistics.calculateMaxHealth();
                        }
                    }
                }
            }
            // PRZENIESIENIE NA ZIEMIE, NA RAZIE Z PLECAKA
            else if (draggedItemData.destinationField.includes('ctx')) {
                for (let i in player.statistics.equipment) {
                    if (i !== 'backpack') continue;
                    console.log(player.statistics.equipment[i]);
                    for (let itemInBackpack in player.statistics.equipment[i]) {
                        console.log(
                            player.statistics.equipment[i][itemInBackpack]
                        );
                        if (
                            player.statistics.equipment[i][itemInBackpack]
                                .fieldInEquipment ===
                            draggedItemData.actualField
                        ) {
                            let updatedObject = Object.assign(
                                {},
                                player.statistics.equipment[i][itemInBackpack]
                            );
                            updatedObject.fieldInEquipment =
                                draggedItemData.destinationField;

                            player.statistics.equipment[
                                i
                                ] = player.statistics.equipment[i].filter(
                                (item) => {
                                    if (
                                        item.fieldInEquipment !==
                                        draggedItemData.actualField
                                    ) {
                                        return item;
                                    }
                                }
                            );

                            this.map.itemsOnMap.push({
                                id: Math.random(),
                                item: updatedObject,
                                positionOnGround: {
                                    x: player.x,
                                    y: player.y,
                                },
                                guiEvents: {
                                    mouseOver: false,
                                },
                                showItemDropDownMenu: false,
                            });

                            const manager = getMongoManager();
                            //manager.remove(Character, {});

                            await manager.updateOne(
                                Character,
                                {
                                    'ownedItems.fieldInEquipment':
                                    draggedItemData.actualField,
                                },
                                {
                                    $pull: {
                                        ownedItems: {
                                            fieldInEquipment:
                                            draggedItemData.actualField,
                                        },
                                    },
                                }
                            );

                            break;
                            /*
                            player.statistics.equipment.updateItemAfterDragging(
                                player.statistics.equipment[i][itemInBackpack],
                                updatedObject,
                                player
                            );

                             */
                        }
                    }
                }
            }

            /*
            for (let i in player.statistics.equipment) {
                if (
                    player.statistics.equipment[i] === null //||
                    //player.statistics.equipment[i] instanceof Array
                )
                    continue;
                //player.statistics.equipment[i].fieldInEquipment =
                //   draggedItemData.destinationField;
                if (!Array.isArray(player.statistics.equipment[i])) {
                    console.log(player.statistics.equipment[i]);
                    console.log('not array');
                    player.statistics.equipment.updateItemAfterDragging(
                        player.statistics.equipment[i],
                        draggedItemData,
                        player
                    );
                } else {
                    console.log(player.statistics.equipment[i]);
                    console.log('array');
                    player.statistics.equipment.updateItemAfterDragging(
                        player.statistics.equipment[i][0],
                        draggedItemData,
                        player
                    );
                }

                //break;
            }

             */
        });
    }

    dumpCharacterStateToDb(player: Player) {
        const manager = getMongoManager();

        setInterval(async () => {
            if (player.x % 32 === 0 && player.y % 32 === 0) {
                await manager.updateOne(
                    Character,
                    { name: player.name },
                    {
                        $set: {
                            x: player.x,
                            y: player.y,
                        },
                    }
                );
            }
        }, 1000);
    }

    socketDisconnect(socket: SocketIO.Socket, player: Player): void {
        // @ts-ignore
        socket.on('disconnect', async () => {
            console.log('disconnect');

            player.coordinatesNormalizer();

            const manager = getMongoManager();
            await manager
                .updateOne(
                    Character,
                    { name: player.name },
                    {
                        $set: {
                            x: player.x,
                            y: player.y,
                            currentDirection: player.currentDirection,
                            'statistics.health': player.statistics._health,
                        },
                    }
                )
                .then(() => player.onDisconnect());
        });
    }

    playerCollided(socket: SocketIO.Socket, player: Player): void {
        socket.on('playerCollided', () => {
            player.onCollision();
        });
    }

    addToGroup(socket: SocketIO.Socket, player: Player): void {
        socket.on('addToGroup', (playerId: string) => {
            let addedPlayer = <Player>(
                this.PLAYERS_LIST.find((player) => player.id === playerId)
            );
            let playerGroup = new Group(player, addedPlayer);
            playerGroup.members.forEach((member: Player) => {
                member.playerSocket.emit('addedToGroup', playerGroup);
            });
        });
    }

    messageHandler(socket: SocketIO.Socket, player: Player): void {
        socket.on('sendMsgToServer', (data: string) => {
            let msg = data.split('/')[1];

            if (new RegExp('(heal )\\d+').test(msg)) {
                let healValue = msg.split(' ')[1];
                player.statistics.health = parseInt(healValue);
            }

            if (new RegExp('(t+p) \\d+[,]\\d+').test(msg)) {
                // @ts-ignore
                let coordinates = msg
                    .match(new RegExp('\\d+[,]\\d+'))[0]
                    .split(',');

                if (player.x < parseInt(coordinates![0]) * 32) {
                    socket.emit(
                        'changeHorizontalMargin',
                        -(parseInt(coordinates![0]) * 32 - player.x)
                    );
                } else if (player.x > parseInt(coordinates![0]) * 32) {
                    socket.emit(
                        'changeHorizontalMargin',
                        player.x - parseInt(coordinates![0]) * 32
                    );
                }
                player.x = parseInt(coordinates![0]) * 32;

                if (player.y < parseInt(coordinates![1]) * 32) {
                    socket.emit(
                        'changeVerticalMargin',
                        -(parseInt(coordinates![1]) * 32 - player.y)
                    );
                } else if (player.y > parseInt(coordinates![1]) * 32) {
                    socket.emit(
                        'changeVerticalMargin',
                        player.y - parseInt(coordinates![1]) * 32
                    );
                }
                player.y = parseInt(coordinates![1]) * 32;
            }

            //console.log(data);
            this.SOCKETS_LIST.forEach((socket) => {
                console.log(socket.id);
                socket.emit('addToChat', data);
            });
        });
    }

    combat(socket: SocketIO.Socket) {
        socket.on('startCombat', (combatData: any) => {
            this.ACTUAL_COMBATS_LIST.push(
                new Fight(combatData.attackers, combatData.defenders)
            );
        });
    }

    emitGameData(): void {
        setInterval(() => {
            let pack = {
                playersData: Player.update(),
                mapData: this.map.mapDataToEmit,
            };
            //console.log(pack.playersData);

            for (let i in this.SOCKETS_LIST) {
                let socket = this.SOCKETS_LIST[i];
                socket.emit('newGameData', pack);
            }
        }, 1000 / 25);
    }
}
