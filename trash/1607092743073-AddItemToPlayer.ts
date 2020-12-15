import { MigrationInterface, QueryRunner } from 'typeorm';
import { ObjectID } from 'mongodb';
import Character from '../server/backend/entity/Character';
import OwnedItem from '../server/backend/entity/OwnedItem';
import ItemBlueprint from '../server/backend/entity/ItemBlueprint';

export class AddItemToPlayer1607092743073 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        ItemBlueprint.findOne(ObjectID('5fca493d7bc2c3cb0becc225')).then(
            (item) => {
                let ownedItem = new OwnedItem();
                ownedItem.itemData = item;
                ownedItem.fieldInEquipment = item.type;

                Character.findOne(ObjectID('5fc97f699b56c4c053844c28')).then(
                    (user) => {
                        user.ownedItems.push(ownedItem);
                        user.save();
                    }
                );
            }
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
