import { getMongoManager, MigrationInterface, QueryRunner } from 'typeorm'
import EnemyExample from '../server/backend/entity/EnemyExample'

export class EnemyExampleUpdate1606648619891 implements MigrationInterface {
  public async up (queryRunner: QueryRunner): Promise<void> {
    const manager = getMongoManager()
    await manager.updateOne(
      EnemyExample,
      { name: 'Lew' },
      {
        $set: {
          imageSrc: './img/enemy.png'
        }
      },
      { upsert: true }
    )
  }

  public async down (queryRunner: QueryRunner): Promise<void> {}
}
