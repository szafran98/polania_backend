import { MigrationInterface, QueryRunner } from 'typeorm'
import OwnedItem from '../server/backend/entity/OwnedItem'
import Character from '../server/backend/entity/Character'
import { ObjectID } from 'mongodb'

export class AddItemToPlayer71607094428602 implements MigrationInterface {
  public async up (queryRunner: QueryRunner): Promise<void> {
    OwnedItem.findOne(ObjectID('5fca4f2b915dfbcbe462fe72')).then(
      (ownedItem) => {
        console.log(ownedItem)
        Character.findOne(ObjectID('5fc97f699b56c4c053844c28')).then(
          (character) => {
            console.log(ownedItem)
            character.ownedItems = [ownedItem]
            character.save()
          }
        )
      }
    )
  }

  public async down (queryRunner: QueryRunner): Promise<void> {}
}
