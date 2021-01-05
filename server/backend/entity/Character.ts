import { BaseEntity, Column, Entity, ObjectID, ObjectIdColumn } from 'typeorm'
import Stats from './Stats'

@Entity()
export default class Character extends BaseEntity {
    @ObjectIdColumn()
    id!: ObjectID;

    @Column()
    name!: string;

    @Column()
    x!: number;

    @Column()
    y!: number;

    @Column()
    currentDirection!: number;

    @Column()
    imageSrc!: string;

    @Column((type) => Stats)
    statistics!: Stats;

    @Column()
    ownedItemsIds!: number[];

    @Column()
    gold!: number;
}
