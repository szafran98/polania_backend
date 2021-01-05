import { getMongoManager, MigrationInterface, QueryRunner } from 'typeorm'
import { User } from '../server/backend/entity/User'

export class AdminImageUpdate1606429063297 implements MigrationInterface {
  public async up (queryRunner: QueryRunner): Promise<void> {
    const manager = getMongoManager()
    await manager.updateOne(
      User,
      { username: 'admin', 'characters.name': 'admin' },
      {
        $set: {
          'characters.$.imageSrc': '../public/img/admin.png'
        }
      },
      { upsert: true }
    )
  }

  public async down (queryRunner: QueryRunner): Promise<void> {}
}
