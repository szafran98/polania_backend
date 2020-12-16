import Player from './Player';
import { IOwnedItem } from '../../../../Interfaces';
import { game } from '../../../../app';

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
                //console.log(itemData);
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
            this.player1.isOfferAccepted = true;
            this.synchronizeTradeStateInClient();
            this.isTradeAcceptedByParticipants();
        });

        this.player2.instance.playerSocket.on('acceptTradeOffer', () => {
            this.player2.isOfferAccepted = true;
            this.synchronizeTradeStateInClient();
            this.isTradeAcceptedByParticipants();
        });
    }

    isTradeAcceptedByParticipants() {
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
