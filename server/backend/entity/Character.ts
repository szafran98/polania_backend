import {
    Entity,
    ObjectIdColumn,
    ObjectID,
    Column,
    OneToOne,
    JoinColumn,
    BaseEntity,
} from 'typeorm';
import Stats from './Stats';
import OwnedItem from './OwnedItem';

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
    collection!: object;

    @Column()
    currentDirection!: number;

    @Column()
    imageSrc!: string;

    @Column((type) => Stats)
    statistics!: Stats;

    @Column()
    ownedItemsIds!: number[];
}
