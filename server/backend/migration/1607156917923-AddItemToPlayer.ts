import { getMongoManager, MigrationInterface, QueryRunner } from 'typeorm';
import OwnedItem from '../entity/OwnedItem';
import Character from '../entity/Character';
import { ObjectID } from 'mongodb';
import ItemBlueprint from '../entity/ItemBlueprint';

export class AddItemToPlayer1607156917923 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        ItemBlueprint.findOne(ObjectID('5fcb448eaca166d9135a6e2b')).then(
            (item) => {
                let ownedItem = new OwnedItem();
                ownedItem.itemData = item;
                ownedItem.fieldInEquipment = item.type;

                ownedItem.save().then((res) => {
                    console.log(res);
                });
            }
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
