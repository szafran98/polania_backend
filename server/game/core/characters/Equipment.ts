import {IItem, IOwnedItem, IStats} from '../../../../Interfaces';
import { ItemType } from '../../Enums';
import Item from './Item';
import { getMongoManager, getMongoRepository } from 'typeorm';
import Character from '../../../backend/entity/Character';
import Player from './Player';
import { ObjectID } from 'mongodb';
import { User } from '../../../backend/entity/User';
import OwnedItem from "../../../backend/entity/OwnedItem";
import ItemBlueprint from "../../../backend/entity/ItemBlueprint";

export class Equipment {
    helmet: IOwnedItem = null;
    ring: IOwnedItem = null;
    amulet: IOwnedItem = null;
    gloves: IOwnedItem = null;
    weapon: IOwnedItem = null;
    armor: IOwnedItem = null;
    boots: IOwnedItem = null;

    backpack: IOwnedItem[] = [];

    constructor(ownedItems: IOwnedItem[]) {
        console.log(ownedItems);
        if (Object.keys(ownedItems).length === 0) return;
        //console.log(Object.keys(ownedItems).length === 0);
        //console.log(ownedItems);
        //console.log('owned items ^^^');
        //ownedItems.forEach((item) => {
        for (let item in ownedItems) {
            //Object.keys(this).forEach((property) => {
            for (let property of Object.keys(this)) {
                //console.log(item);
                if (ownedItems[item] instanceof Array) return;
                let ownedItem: IOwnedItem = {
                    id: ownedItems[item].id,
                    itemData: new Item(ownedItems[item].itemData),
                    fieldInEquipment: ownedItems[item].fieldInEquipment,
                };
                if (property === ownedItems[item].fieldInEquipment) {
                    this[property] = ownedItem;
                    break;
                } else if (
                    ownedItems[item].fieldInEquipment.includes('field')
                ) {
                    this.backpack.push(ownedItem);
                    break;
                }
            }
        }
        console.log(this);
        //console.log(this);
    }

    get equipmentStats() {
        let statsSum: IStats = {};

        //if (Object.keys(this).length !== 0) {
        Object.values(this).forEach((item: IOwnedItem) => {
            if (item === null || item instanceof Array) return;
            console.log(item);
            Object.keys(item.itemData.statistics).forEach((stat) => {
                // @ts-ignore
                if (item.itemData.statistics[stat]) {
                    // @ts-ignore
                    if (!statsSum[stat]) {
                        // @ts-ignore
                        statsSum[stat] = item.itemData.statistics[stat];
                    } else {
                        // @ts-ignore
                        statsSum[stat] += item.itemData.statistics[stat];
                    }
                }
            });
        });
        //}
        return statsSum;
    }

    static getFirstEmptyFieldIdInBackpack(player: Player): string {
        let firstEmptyFieldInBackpack;
        for (let i = 1; i < 42; i++) {
            let playerBackpack = player.statistics.equipment.backpack
            let instanceInCheckedField = playerBackpack.find(itemInField => itemInField.fieldInEquipment === `field${i}`)
            if (!instanceInCheckedField) {
                firstEmptyFieldInBackpack = `field${i}`
                break
            }
        }
        return  firstEmptyFieldInBackpack
    }

    async addToBackpack(item: ItemBlueprint, fieldInEquipment: string, player: Player) {



        let ownedItem = new OwnedItem()
        ownedItem.itemData = item
        ownedItem.fieldInEquipment = fieldInEquipment



        let manager = getMongoManager()

        let newItemDatabaseId

        await manager.insert(OwnedItem, ownedItem).then(async res => {
            newItemDatabaseId = res.raw.insertedId

            // @ts-ignore
            item.id = item.id.toString()
            ownedItem.id = newItemDatabaseId
            // @ts-ignore
            ownedItem = {
                id: newItemDatabaseId.toString(),
                // @ts-ignore
                itemData: new Item(item),
                fieldInEquipment: fieldInEquipment
            }

            // @ts-ignore
            this.backpack.push(ownedItem)
            player.playerSocket.emit('putBoughtItemInBackpack', ownedItem)

        }).then(async () => {
            await manager.updateOne(Character, { '_id': ObjectID(player.id) }, {
                $push: {
                    'ownedItemsIds': newItemDatabaseId
                }
            })
        })
    }


    //async addBoughtItemAndSaveInDatabase(item: IOwnedItem)

    async updateItemAfterDragging(
        beforeDrag: IOwnedItem,
        afterDrag: IOwnedItem,
        player: Player
    ) {
        //console.log(afterDrag);
        let fromField = beforeDrag.fieldInEquipment;

        console.log(beforeDrag, afterDrag);

        console.log(beforeDrag.fieldInEquipment, afterDrag.fieldInEquipment);
        let eqProperties = Object.keys(this);
        if (
            afterDrag.fieldInEquipment.includes('field') &&
            !beforeDrag.fieldInEquipment.includes('field')
        ) {
            console.log('case 1');
            //let fromField = beforeDrag.fieldInEquipment;

            beforeDrag.fieldInEquipment = afterDrag.fieldInEquipment;

            for (const property of eqProperties) {
                if (property === afterDrag.itemData.type) {
                    this[property] = null;

                    const manager = getMongoManager();
                    /*
                    await manager.updateOne(
                        Character,
                        {
                            'ownedItems.fieldInEquipment': fromField,
                        },
                        {
                            $set: {
                                'ownedItems.$.fieldInEquipment':
                                afterDrag.fieldInEquipment,
                            },
                        }
                    );

                     */
                    await manager.updateOne(
                        OwnedItem,
                        {
                            '_id': ObjectID(afterDrag.id),
                        },
                        {
                            $set: {
                                'fieldInEquipment':
                                afterDrag.fieldInEquipment,
                            },
                        }
                    );
                }
            }
            beforeDrag.fieldInEquipment = afterDrag.fieldInEquipment;
            this.backpack.push(beforeDrag);
        } else if (
            beforeDrag.fieldInEquipment.includes('field') &&
            !afterDrag.fieldInEquipment.includes('field')
        ) {
            console.log('case 2');
            //console.log(this.backpack);
            beforeDrag.fieldInEquipment = afterDrag.fieldInEquipment;
            for (const property of eqProperties) {
                console.log(property, afterDrag.fieldInEquipment);
                if (property === afterDrag.fieldInEquipment) {
                    console.log('powinno przypisać');
                    this[property] = beforeDrag;

                    console.log('case 2 inside');


                    const manager = getMongoManager();
                    /*
                    await manager.updateOne(
                        Character,
                        {
                            'ownedItems.fieldInEquipment': fromField,
                        },
                        {
                            $set: {
                                'ownedItems.$.fieldInEquipment':
                                afterDrag.fieldInEquipment,
                            },
                        }
                    );

                     */
                    await manager.updateOne(
                        OwnedItem,
                        {
                            '_id': ObjectID(afterDrag.id),
                        },
                        {
                            $set: {
                                'fieldInEquipment':
                                afterDrag.fieldInEquipment,
                            },
                        }
                    );

                    let indexInBackpack = this.backpack.indexOf(beforeDrag);
                    if (indexInBackpack > -1) {
                        this.backpack.splice(indexInBackpack, 1);
                    }
                }
            }
        } else if (
            beforeDrag.fieldInEquipment.includes('field') &&
            afterDrag.fieldInEquipment.includes('field')
        ) {
            console.log('case 3');
            for (let item in this.backpack) {
                if (
                    this.backpack[item].fieldInEquipment ===
                    beforeDrag.fieldInEquipment
                ) {
                    this.backpack[item].fieldInEquipment =
                        afterDrag.fieldInEquipment;

                    console.log(fromField, afterDrag.fieldInEquipment);
                    const manager = getMongoManager();

                    await manager.updateOne(
                        OwnedItem,
                        {
                            '_id': ObjectID(afterDrag.id),
                        },
                        {
                            $set: {
                                'fieldInEquipment':
                                afterDrag.fieldInEquipment,
                            },
                        }
                    );
                }
            }
        } else {
            console.log('non case');
        }
        console.log(this);
    }
}
