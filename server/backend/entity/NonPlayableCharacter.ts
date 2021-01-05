import { BaseEntity, Column, Entity, ObjectID, ObjectIdColumn } from 'typeorm'

@Entity()
export default class NonPlayableCharacter extends BaseEntity {
    @ObjectIdColumn()
    id!: number;

    @Column()
    name!: string;

    @Column()
    imageSrc!: string;

    @Column()
    offeringItemsIds: ObjectID[];

    @Column()
    conversationOptions!: object;

    @Column()
    conversationOptionsTree!: object;
}
