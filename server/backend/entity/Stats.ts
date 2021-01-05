import { BaseEntity, Column, Entity, ObjectID, ObjectIdColumn } from 'typeorm'

@Entity()
export default class Stats extends BaseEntity {
    @ObjectIdColumn()
    id!: ObjectID;

    @Column('array')
    attack!: number[];

    @Column('int')
    attackSpeed!: number;

    @Column('double')
    criticalStrikeChance!: number;

    @Column('double')
    criticalStrikePower!: number;

    @Column()
    strength!: number;

    @Column()
    dexterity!: number;

    @Column()
    intellect!: number;

    @Column()
    energy!: number;

    @Column()
    mana!: number;

    @Column()
    fireResistance!: number;

    @Column()
    frostResistance!: number;

    @Column()
    lightningResistance!: number;

    @Column()
    poisonResistance!: number;

    @Column()
    armor!: number;

    @Column()
    health!: number;

    @Column()
    dodge!: number;

    @Column()
    level!: number;

    @Column()
    experience!: number;
}
