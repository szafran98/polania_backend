import { getMongoManager, MigrationInterface, QueryRunner } from 'typeorm'
import { User } from '../server/backend/entity/User'

export class UserImgUpdate1606648383355 implements MigrationInterface {
  public async up (queryRunner: QueryRunner): Promise<void> {
    const manager = getMongoManager()
    await manager.updateOne(
      User,
      { username: 'admin', 'characters.name': 'admin' },
      {
        $set: {
          'characters.$.imageSrc': './img/admin.png'
        }
      },
      { upsert: true }
    )
  }

  public async down (queryRunner: QueryRunner): Promise<void> {}
}
