import { getMongoManager, MigrationInterface, QueryRunner } from 'typeorm';
import OwnedItem from '../server/backend/entity/OwnedItem';
import Character from '../server/backend/entity/Character';
import { ObjectID } from 'mongodb';

export class AddItemToPlayer81607094687869 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        OwnedItem.findOne(ObjectID('5fca4f2b915dfbcbe462fe72')).then(
            async (ownedItem) => {
                console.log(ownedItem);

                let manager = getMongoManager();
                await manager.updateOne(
                    Character,
                    {
                        _id: ObjectID('5fc97f699b56c4c053844c28'),
                    },
                    {
                        $push: {
                            ownedItems: ownedItem,
                        },
                    }
                );
            }
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
