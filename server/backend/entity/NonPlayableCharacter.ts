import {
    Entity,
    ObjectIdColumn,
    ObjectID,
    Column,
    OneToOne,
    JoinColumn,
    BaseEntity,
} from 'typeorm';

@Entity()
export default class NonPlayableCharacter extends BaseEntity {
    @ObjectIdColumn()
    id!: number

    @Column()
    name!: string;

    @Column()
    imageSrc!: string;

    @Column()
    conversationOptions!: object

    @Column()
    conversationOptionsTree!: object
}