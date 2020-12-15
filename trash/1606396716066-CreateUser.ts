import { getRepository, MigrationInterface, QueryRunner } from 'typeorm';
import { User } from '../server/backend/entity/User';
import Character from '../server/backend/entity/Character';
import Stats from '../server/backend/entity/Stats';

export class CreateUser1606396716066 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        let user = new User();
        user.username = 'szafran98';
        user.password = 'Kogut100';
        user.hashPassword();
        user.role = 'ADMIN';

        let character = new Character();
        character.name = 'szafran';
        character.x = 256;
        character.y = 256;
        character.currentDirection = 0;
        character.imageSrc = '../public/img/m_pal28.png';
        character.statistics = new Stats();
        character.statistics.attack = [7, 9];
        character.statistics.attackSpeed = 1;
        character.statistics.criticalStrikeChance = 1;
        character.statistics.criticalStrikePower = 1;
        character.statistics.strength = 3;
        character.statistics.dexterity = 3;
        character.statistics.intellect = 3;
        character.statistics.energy = 0;
        character.statistics.mana = 0;
        character.statistics.fireResistance = 0;
        character.statistics.frostResistance = 0;
        character.statistics.lightningResistance = 0;
        character.statistics.poisonResistance = 0;
        character.statistics.armor = 10;
        character.statistics.dodge = 0;
        character.statistics.level = 1;
        character.statistics.experience = 0;

        const userRepository = getRepository(User);
        await userRepository.save(user);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
