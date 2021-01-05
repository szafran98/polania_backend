import { BaseEntity, Column, Entity, ObjectID, ObjectIdColumn } from 'typeorm'
import Stats from './Stats'
import { Class, ItemType } from '../../game/Enums'

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
