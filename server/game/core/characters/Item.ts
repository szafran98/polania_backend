import { Class, ItemType } from '../../Enums'
import Player from './Player'
import { IItem, IOwnedItem, IStats } from '../../../../Interfaces'
import { getMongoManager } from 'typeorm'
import Character from '../../../backend/entity/Character'
import { ObjectID } from 'mongodb'

export default class Item implements IItem {
    id: string;
    name: string;
    type: ItemType;
    statistics: IStats;
    class: Class;
    value: number;
    requiredLevel: number;
    imageSrc!: string;
    // image!: HTMLImageElement;

    constructor (itemData: IItem) {
      this.id = itemData.id
      this.name = itemData.name
      this.type = itemData.type
      this.statistics = itemData.statistics
      this.class = itemData.class
      this.value = itemData.value
      this.requiredLevel = itemData.requiredLevel
      if (itemData.imageSrc) {
        this.imageSrc = <string>itemData.imageSrc
      }
    }

    static async doConsumableItemDbClickAction (
      item: IOwnedItem,
      player: Player
    ) {
      console.log('halo kurwa 1')
      if (item.itemData.requiredLevel > player.statistics._level) return
      console.log('halo kurwa 2')
      if (item.itemData.statistics.health) {
        console.log('healed')

        if (
          player.statistics.health + item.itemData.statistics.health >
                player.statistics.maxHealth
        ) {
          player.statistics.health = player.statistics.maxHealth
        } else {
          player.statistics.health += item.itemData.statistics.health
        }

        console.log(player.statistics.health)

        player.statistics.equipment.backpack = player.statistics.equipment.backpack.filter(
          (itemInstance) => itemInstance.id !== item.id
        )

        const manager = getMongoManager()
        await manager
          .updateOne(
            Character,
            { _id: ObjectID(player.id) },
            {
              $pull: {
                ownedItemsIds: item.id
              }
            }
          )
          .then(() =>
            player.playerSocket.emit(
              'removeConsumedItemFromBackpack',
              item
            )
          )
      }
    }
}
