import { MigrationInterface, QueryRunner } from 'typeorm'
import ItemBlueprint from '../server/backend/entity/ItemBlueprint'
import OwnedItem from '../server/backend/entity/OwnedItem'
import Character from '../server/backend/entity/Character'
import { ObjectID } from 'mongodb'

export class AddItemToPlayer41607093761794 implements MigrationInterface {
  public async up (queryRunner: QueryRunner): Promise<void> {
    ItemBlueprint.findOne(ObjectID('5fca493d7bc2c3cb0becc225')).then(
      (item) => {
        const ownedItem = new OwnedItem()
        ownedItem.itemData = item
        ownedItem.fieldInEquipment = item.type

        ownedItem.save().then((res) => {
          console.log(res)

          Character.findOne(
            ObjectID('5fc97f699b56c4c053844c28')
          ).then((user) => {
            user.ownedItems = [res]
            user.save()
          })
        })
      }
    )
  }

  public async down (queryRunner: QueryRunner): Promise<void> {}
}
