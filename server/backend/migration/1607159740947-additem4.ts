import { getMongoManager, MigrationInterface, QueryRunner } from 'typeorm';
import OwnedItem from '../entity/OwnedItem';
import Character from '../entity/Character';
import { ObjectID } from 'mongodb';

export class additem41607159740947 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        OwnedItem.findOne(ObjectID('5fcb454ae1111ed930fca837')).then(
            async (ownedItem) => {
                console.log(ownedItem);

                let manager = getMongoManager();
                await manager.updateOne(
                    Character,
                    {
                        _id: ObjectID('5fcb4fa0610758da63ef2ece'),
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
