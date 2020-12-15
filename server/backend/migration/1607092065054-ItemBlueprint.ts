import { MigrationInterface, QueryRunner } from 'typeorm';
import ItemBlueprint from '../entity/ItemBlueprint';
import { Class, ItemType } from '../../game/Enums';
import Stats from '../entity/Stats';

export class ItemBlueprint1607092065054 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        let item = new ItemBlueprint();
        item.name = 'Tępy miecz';
        item.type = ItemType.WEAPON;
        item.value = 10;
        item.class = Class.WARRIOR;
        item.requiredLevel = 1;
        item.imageSrc = 'miecz.png';
        item.statistics = new Stats();
        item.statistics.attack = [11, 15];
        item.statistics.strength = 2;

        await item.save();
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
