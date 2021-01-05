import Fight from './Fight';
import {
    Connection,
    createConnection,
    getConnection,
    getMongoManager,
} from 'typeorm';
import axios from 'axios';
import { ObjectID } from 'mongodb';
import SocketIO from 'socket.io';
// const SocketIO = require('socket.io');
import Player from './characters/Player';
import Map from './Map';
import Group from './characters/Group';
import Character from '../../backend/entity/Character';
import { IOwnedItem } from '../../../Interfaces';
import Trade from './characters/Trade';
import Item from './characters/Item';
import ItemBlueprint from '../../backend/entity/ItemBlueprint';
import { ItemType } from '../Enums';
import { Equipment } from './characters/Equipment';

export default class GameServer {
    SOCKETS_LIST: SocketIO.Socket[] = [];
    PLAYERS_LIST: Player[] = [];
    ACTUAL_COMBATS_LIST: Fight[] = [];
    ACTUAL_TRADES_LIST: Trade[] = [];
    PLAYERS_GROUPS: Group[] = [];
    socketio: SocketIO.Server;
    map!: Map;
    dbConnection!: Connection;

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
            console.log('player count ' + this.PLAYERS_LIST.length);

            // LOGOWANIE PO WYBRANIU POSTACI
            socket.on('loginOnCharacter', async (loginData) => {
                await axios
                    .post(
                        'http://localhost:2000/character/getSelectedCharacter',
                        {
                            characterId: loginData.characterId,
                        },
                        {
                            headers: {
                                auth: loginData.token,
                            },
                        }
                    )
                    .then((res) => {
                        const character = res.data;
                        character.socketId = socket.id;

                        let isActualyLogged = false;

                        // JEŚLI POSTAĆ ZALOGOWANA TO DC
                        for (const i in this.PLAYERS_LIST) {
                            if (this.PLAYERS_LIST[i].id === character.id) {
                                isActualyLogged = true;
                                socket.disconnect();
                            }
                        }

                        if (!isActualyLogged) {
                            const player = new Player(character);

                            this.PLAYERS_LIST.push(player);
                            this.SOCKETS_LIST.push(socket);

                            player.keyPressListener();

                            this.combat(socket);
                            this.playerCollided(socket, player);
                            this.addToGroup(socket, player);
                            this.messageHandler(socket, player);
                            this.socketDisconnect(socket, player);
                            this.dragItem(socket, player);
                            this.getItemFromGround(socket, player);
                            this.requestTradeWithPlayer(socket, player);
                            this.abortTrade(socket, player);
                            this.buyItem(socket, player);
                            this.sellItem(socket, player);
                            this.doItemDbClickAction(socket, player);
                            // this.dumpCharacterStateToDb(player);
                        }
                    });
            });
        });
    }

    // DWUKLIK NA ITEM
    doItemDbClickAction(socket: SocketIO.Socket, player: Player) {
        socket.on('doItemDbClickAction', (itemId: string) => {
            const itemInstance = player.statistics.equipment.backpack.find(
                (itemInstance) => {
                    return String(itemInstance.id) === itemId;
                }
            );
            if (itemInstance) {
                if (itemInstance.itemData.type === ItemType.CONSUMABLE) {
                    Item.doConsumableItemDbClickAction(itemInstance, player);
                }
            }
        });
    }

    sellItem(socket: SocketIO.Socket, player: Player) {
        socket.on('sellItem', async (itemData: IOwnedItem) => {
            // ZNAJDŹ INSTANCJE
            const itemInstance = player.statistics.equipment.backpack.find(
                (itemInstance) => {
                    if (itemInstance.id === itemData.id) {
                        return itemInstance;
                    }
                }
            );

            // WYRZUĆ Z PLECAKA
            player.statistics.equipment.backpack = player.statistics.equipment.backpack.filter(
                (item) => {
                    if (item !== itemInstance) {
                        return item;
                    }
                }
            );
            // DODAJ ZŁOTO GRACZOWI
            player.gold += itemData.itemData.value;

            // USUŃ Z BAZY
            const manager = getMongoManager();
            await manager.updateOne(
                Character,
                {
                    _id: ObjectID(player.id),
                },
                {
                    $pull: {
                        ownedItemsIds: ObjectID(itemData.id),
                    },
                }
            );
            await manager.updateOne(
                Character,
                {
                    _id: ObjectID(player.id),
                },
                {
                    $set: {
                        gold: player.gold,
                    },
                }
            );
        });
    }

    buyItem(socket: SocketIO.Socket, player: Player) {
        socket.on('buyItem', (itemData: ItemBlueprint) => {
            const firstEmptyFieldInBackpack = Equipment.getFirstEmptyFieldIdInBackpack(
                player
            );

            player.statistics.equipment
                .addToBackpack(itemData, firstEmptyFieldInBackpack, player)
                .then(() => {
                    player.gold -= itemData.value;
                });
        });
    }

    abortTrade(socket: SocketIO.Socket, player: Player) {
        socket.on('tradeAborted', (tradeId: number) => {
            const trade = this.ACTUAL_TRADES_LIST.find(
                (trade) => trade.id === tradeId
            );

            trade.player1.instance.playerSocket.emit('tradeCompleted');
            trade.player2.instance.playerSocket.emit('tradeCompleted');

            trade.player1 = null;
            trade.player2 = null;
            this.ACTUAL_TRADES_LIST = this.ACTUAL_TRADES_LIST.filter(
                (tradeInstance) => {
                    if (tradeInstance.id !== trade.id) {
                        return tradeInstance;
                    }
                }
            );
        });
    }

    requestTradeWithPlayer(socket: SocketIO.Socket, player: Player) {
        socket.on('requestTradeWithPlayer', (playerId: string) => {
            const requestedPlayerInstance = this.PLAYERS_LIST.find(
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

            item.item.fieldInEquipment = Equipment.getFirstEmptyFieldIdInBackpack(
                player
            );
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
    }

    dragItem(socket: SocketIO.Socket, player: Player) {
        socket.on('dragItem', async (draggedItemData) => {
            // PRZENIESIENIE Z EKWIPUNKU DO PLECAKA
            if (
                !draggedItemData.actualField.includes('field') &&
                draggedItemData.destinationField.includes('field')
            ) {
                for (const i in player.statistics.equipment) {
                    if (
                        Array.isArray(player.statistics.equipment[i]) ||
                        player.statistics.equipment[i] === null
                    ) {
                        continue;
                    }
                    if (
                        player.statistics.equipment[i].fieldInEquipment ===
                        draggedItemData.actualField
                    ) {
                        const updatedItem = Object.assign(
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
                    }
                }
            } else if (
                draggedItemData.actualField.includes('field') &&
                draggedItemData.destinationField.includes('field')
            ) {
                // PRZENIESIENIE Z PLECAKA DO PLECAKA
                console.log('case 2');
                for (const i in player.statistics.equipment) {
                    if (i === 'backpack') {
                        console.log('i = backpack');
                        for (const itemInBackpack in player.statistics
                            .equipment[i]) {
                            if (
                                player.statistics.equipment[i][itemInBackpack]
                                    .fieldInEquipment ===
                                draggedItemData.actualField
                            ) {
                                const updatedObject = Object.assign(
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
            } else if (
                !draggedItemData.destinationField.includes('field') &&
                draggedItemData.actualField.includes('field') &&
                !draggedItemData.destinationField.includes('ctx')
            ) {
                // PRZENIESIENIE Z PLECAKA DO EKWIPUNKU

                for (const i in player.statistics.equipment) {
                    if (i !== 'backpack') continue;
                    for (const itemInBackpack in player.statistics.equipment[
                        i
                    ]) {
                        if (
                            player.statistics.equipment[i][itemInBackpack]
                                .fieldInEquipment ===
                            draggedItemData.actualField
                        ) {
                            const updatedObject = Object.assign(
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
            } else if (draggedItemData.destinationField.includes('ctx')) {
                // PRZENIESIENIE NA ZIEMIE, NA RAZIE Z PLECAKA

                for (const i in player.statistics.equipment) {
                    if (i !== 'backpack') continue;
                    console.log(player.statistics.equipment[i]);
                    for (const itemInBackpack in player.statistics.equipment[
                        i
                    ]) {
                        if (
                            player.statistics.equipment[i][itemInBackpack]
                                .fieldInEquipment ===
                            draggedItemData.actualField
                        ) {
                            const updatedObject = Object.assign(
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
                            // manager.remove(Character, {});

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
                        }
                    }
                }
            }
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
                            gold: player.gold,
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
            const addedPlayer = <Player>(
                this.PLAYERS_LIST.find((player) => player.id === playerId)
            );
            const playerGroup = new Group(player, addedPlayer);
            playerGroup.members.forEach((member: Player) => {
                member.playerSocket.emit('addedToGroup', playerGroup);
            });
        });
    }

    messageHandler(socket: SocketIO.Socket, player: Player): void {
        socket.on('sendMsgToServer', (data: string) => {
            const msg = data.split('/')[1];

            if (new RegExp('(heal )\\d+').test(msg)) {
                const healValue = msg.split(' ')[1];
                player.statistics.health = parseInt(healValue);
            }

            if (new RegExp('(t+p) \\d+[,]\\d+').test(msg)) {
                // @ts-ignore
                const coordinates = msg
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

            // console.log(data);
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
        // const dataEmitWorker = new Worker('./server/game/core/dataEmiter.js', { type: 'module' })

        setInterval(() => {
            const pack = {
                playersData: Player.update(),
                mapData: this.map.mapDataToEmit,
            };

            this.socketio.sockets.emit('newGameData', pack);
        }, 1000 / 25);
    }
}
