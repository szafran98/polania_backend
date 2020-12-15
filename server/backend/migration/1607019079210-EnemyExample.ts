import { MigrationInterface, QueryRunner } from 'typeorm';
import EnemyExample from '../entity/EnemyExample';
import Stats from '../entity/Stats';

export class EnemyExample1607019079210 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        let enemy = new EnemyExample();
        enemy.x = 256;
        enemy.y = 256;
        enemy.name = 'Lew';
        enemy.height = 64;
        enemy.width = 64;
        enemy.mapId = 15;
        enemy.spawnTime = 5;
        enemy.type = 'enemy';
        enemy.imageSrc = 'enemy.png';
        enemy.statistics = new Stats();
        enemy.statistics.attack = [7, 10];
        enemy.statistics.armor = 12;
        enemy.statistics.attackSpeed = 1;
        enemy.statistics.criticalStrikeChance = 1.5;
        enemy.statistics.criticalStrikePower = 1.2;
        enemy.statistics.dexterity = 3;
        enemy.statistics.strength = 8;
        enemy.statistics.experience = 50;
        enemy.statistics.intellect = 3;
        enemy.statistics.level = 1;

        await enemy.save();
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
