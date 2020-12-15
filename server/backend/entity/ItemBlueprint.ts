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
import { ItemType, Class } from '../../game/Enums';

@Entity()
export default class ItemBlueprint extends BaseEntity {
    @ObjectIdColumn()
    id!: ObjectID;

    @Column()
    name!: string;

    @Column()
    type!: ItemType;

    @Column((type) => Stats)
    statistics!: Stats;

    @Column()
    value!: number;

    @Column()
    requiredLevel!: number;

    @Column()
    class!: Class;

    @Column()
    imageSrc!: string;
}
