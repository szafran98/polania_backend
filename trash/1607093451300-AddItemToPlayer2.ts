import { MigrationInterface, QueryRunner } from 'typeorm';
import { ObjectID } from 'mongodb';
import ItemBlueprint from '../server/backend/entity/ItemBlueprint';
import OwnedItem from '../server/backend/entity/OwnedItem';
import Character from '../server/backend/entity/Character';

export class AddItemToPlayer21607093451300 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        ItemBlueprint.findOne(ObjectID('5fca493d7bc2c3cb0becc225')).then(
            async (item) => {
                let ownedItem = new OwnedItem();
                ownedItem.itemData = item;
                ownedItem.fieldInEquipment = item.type;

                await ownedItem.save();

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
