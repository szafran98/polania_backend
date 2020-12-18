import Player from './Player';
import { IOwnedItem } from '../../../../Interfaces';
import { game } from '../../../../app';
import {getMongoManager} from "typeorm";
import OwnedItem from "../../../backend/entity/OwnedItem";
import { ObjectID } from 'mongodb'
import Character from "../../../backend/entity/Character";

export default class Trade {
    id = Math.random();
    player1: {
        instance: Player;
        offer?: IOwnedItem;
        isOfferAccepted: boolean;
    };
    player2: {
        instance: Player;
        offer?: IOwnedItem;
        isOfferAccepted: boolean;
    };

    constructor(player1: Player, player2: Player) {
        this.player1 = {
            instance: game.PLAYERS_LIST.find(playerInstance => playerInstance.id === player1.id),
            offer: undefined,
            isOfferAccepted: false,
        };

        this.player2 = {
            instance: game.PLAYERS_LIST.find(playerInstance => playerInstance.id === player2.id),
            offer: undefined,
            isOfferAccepted: false,
        };

        this.playerOfferListener();
        this.playerIsOfferAcceptedListener();
        this.initializeTradeForClients();
    }

    initializeTradeForClients() {
        this.player1.instance.playerSocket.emit('initializeTrade', this);
        this.player2.instance.playerSocket.emit('initializeTrade', this);
    }

    synchronizeTradeStateInClient() {
        this.player1.instance.playerSocket.emit('synchronizeTradeState', this);
        this.player2.instance.playerSocket.emit('synchronizeTradeState', this);
    }

    playerOfferListener() {
        this.player1.instance.playerSocket.on(
            'setOfferedItemInTrade',
            (itemData: IOwnedItem) => {
                if (this.player1 === null || this.player2 === null) return
                console.log(this);
                console.log(game.ACTUAL_TRADES_LIST);
                let itemOfferedByPlayer = this.player1.instance.statistics.equipment.backpack.find(
                    (item) => item.itemData.id === itemData.itemData.id
                );

                //console.log(itemData);

                if (itemOfferedByPlayer) {
                    this.player1.offer = itemOfferedByPlayer;
                }
                //console.log(this);
                this.synchronizeTradeStateInClient();
            }
        );

        this.player2.instance.playerSocket.on(
            'setOfferedItemInTrade',
            (itemData: IOwnedItem) => {
                if (this.player1 === null || this.player2 === null) return
                console.log(this);
                let itemOfferedByPlayer = this.player2.instance.statistics.equipment.backpack.find(
                    (item) => item.itemData.id === itemData.itemData.id
                );

                if (itemOfferedByPlayer) {
                    this.player2.offer = itemOfferedByPlayer;
                }
                //console.log(this);
                this.synchronizeTradeStateInClient();
            }
        );
    }

    playerIsOfferAcceptedListener() {
        this.player1.instance.playerSocket.on('acceptTradeOffer', () => {
            if (this.player1 === null || this.player2 === null) return
            this.player1.isOfferAccepted = true;
            this.synchronizeTradeStateInClient();
            this.isTradeAcceptedByParticipants();
        });

        this.player2.instance.playerSocket.on('acceptTradeOffer', () => {
            if (this.player1 === null || this.player2 === null) return
            this.player2.isOfferAccepted = true;
            this.synchronizeTradeStateInClient();
            this.isTradeAcceptedByParticipants();
        });
    }

    async isTradeAcceptedByParticipants() {
        if (this.player1 === null || this.player2 === null) return
        if (this.player1.isOfferAccepted && this.player2.isOfferAccepted) {
            try {
                //GET PLAYER1 ITEM
                let player1Item = this.player1.instance.statistics.equipment.backpack.find(
                    (itemInstance) => itemInstance.id === this.player1.offer.id
                );

                //DELETE ITEM IN BACKPACK
                let player1ItemIndex = this.player1.instance.statistics.equipment.backpack.indexOf(
                    player1Item
                );
                if (player1ItemIndex > -1) {
                    this.player1.instance.statistics.equipment.backpack.splice(
                        player1ItemIndex,
                        1
                    );
                }

                // ADD TO PLAYER2 BACKPACK
                this.player2.instance.statistics.equipment.backpack.push(
                    player1Item
                );

                ////////////////////////////////////////////////////////////////////

                //GET PLAYER2 ITEM
                let player2Item = this.player2.instance.statistics.equipment.backpack.find(
                    (itemInstance) => itemInstance.id === this.player2.offer.id
                );

                //DELETE ITEM IN BACKPACK
                let player2ItemIndex = this.player2.instance.statistics.equipment.backpack.indexOf(
                    player2Item
                );
                if (player2ItemIndex > -1) {
                    this.player2.instance.statistics.equipment.backpack.splice(
                        player2ItemIndex,
                        1
                    );
                }

                // ADD TO PLAYER1 BACKPACK
                this.player1.instance.statistics.equipment.backpack.push(
                    player2Item
                );

                console.log(player1Item.id)
                console.log('player 1 item id ^^^^^')

                // REMOVE ITEM FOR PLAYER 1 IN DB
                const manager = getMongoManager();
                await manager.updateOne(
                    Character,
                    {
                        '_id': ObjectID(this.player1.instance.id),
                    },
                    {
                        '$pull': {
                            'ownedItemsIds': player1Item.id
                        },
                    }
                )
                await manager.updateOne(
                    Character,
                    {
                        '_id': ObjectID(this.player1.instance.id),
                    },
                    {
                        '$push': {
                            'ownedItemsIds': player2Item.id
                        },
                    }
                );
                await manager.updateOne(
                    Character,
                    {
                        '_id': ObjectID(this.player2.instance.id),
                    },
                    {
                        '$pull': {
                            'ownedItemsIds': player2Item.id
                        },
                    }
                )
                await manager.updateOne(
                    Character,
                    {
                        '_id': ObjectID(this.player2.instance.id),
                    },
                    {
                        '$push': {
                            'ownedItemsIds': player1Item.id
                        },
                    }
                );

            } finally {
                this.player1.instance.playerSocket.emit('tradeCompleted')
                this.player2.instance.playerSocket.emit('tradeCompleted')




                game.ACTUAL_TRADES_LIST = game.ACTUAL_TRADES_LIST.filter(
                    (trade) => {
                        if (trade.id !== this.id) {
                            return trade;
                        }
                    }
                );

            }
        }
        console.log(this.player1.instance.statistics.equipment.backpack)
        console.log(this.player2.instance.statistics.equipment.backpack)
        console.log('finalized trade ^^^^^^')
    }
}
