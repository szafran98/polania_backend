import { getMongoManager, MigrationInterface, QueryRunner } from 'typeorm'
import OwnedItem from '../entity/OwnedItem'
import Character from '../entity/Character'
import { ObjectID } from 'mongodb'

export class additem51607253707453 implements MigrationInterface {
  public async up (queryRunner: QueryRunner): Promise<void> {
    OwnedItem.findOne(ObjectID('5fcb454ae1111ed930fca837')).then(
      async (ownedItem) => {
        console.log(ownedItem)

        const manager = getMongoManager()
        await manager.updateOne(
          Character,
          {
            _id: ObjectID('5fccbca264e82eef4f8fc193')
          },
          {
            $push: {
              ownedItems: ownedItem
            }
          }
        )
      }
    )
  }

  public async down (queryRunner: QueryRunner): Promise<void> {}
}
