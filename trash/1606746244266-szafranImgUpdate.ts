import { getMongoManager, MigrationInterface, QueryRunner } from 'typeorm';
import { User } from '../server/backend/entity/User';

export class szafranImgUpdate1606746244266 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const manager = getMongoManager();
        await manager.updateOne(
            User,
            { username: 'szafran98', 'characters.name': 'szafran' },
            {
                $set: {
                    'characters.$.imageSrc': './img/m_pal28.png',
                },
            },
            { upsert: true }
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
