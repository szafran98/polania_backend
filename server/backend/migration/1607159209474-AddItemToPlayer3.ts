import { getMongoManager, MigrationInterface, QueryRunner } from 'typeorm';
import OwnedItem from '../entity/OwnedItem';
import Character from '../entity/Character';
import { ObjectID } from 'mongodb';

export class AddItemToPlayer31607159209474 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        OwnedItem.findOne(ObjectID('5fcb454ae1111ed930fca837')).then(
            async (ownedItem) => {
                console.log(ownedItem);

                let manager = getMongoManager();
                await manager.updateOne(
                    Character,
                    {
                        _id: ObjectID('5fcb4d8c1b4e8ada0e694032'),
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
