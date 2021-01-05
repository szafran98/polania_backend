import { BaseEntity, Column, Entity, ObjectID, ObjectIdColumn } from 'typeorm'
import ItemBlueprint from './ItemBlueprint'

@Entity()
export default class OwnedItem extends BaseEntity {
    @ObjectIdColumn()
    id!: ObjectID;

    @Column((type) => ItemBlueprint)
    itemData!: ItemBlueprint;

    @Column()
    fieldInEquipment!: string;
}
