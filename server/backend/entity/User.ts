import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ObjectID,
  ObjectIdColumn,
  Unique,
  UpdateDateColumn
} from 'typeorm'
import { IsEmail, IsNotEmpty, Length } from 'class-validator'
import bcrypt from 'bcryptjs'
import { UniqueOnDatabase } from '../examples/UniqueValidation'

@Entity()
@Unique(['username'])
export class User extends BaseEntity {
    @ObjectIdColumn()
    id!: number;

    @Column()
    @Length(4, 20)
    username!: string;

    @Column()
    @IsEmail()
    @UniqueOnDatabase(User, { message: 'Adres email zajęty' })
    email!: string;

    @Column()
    @Length(4, 100)
    password!: string;

    @Column()
    @IsNotEmpty()
    role!: string;

    @Column()
    @CreateDateColumn()
    createdAt!: Date;

    @Column()
    @UpdateDateColumn()
    updatedAt!: Date;

    @Column()
    charactersIds!: ObjectID[];

    hashPassword () {
      this.password = bcrypt.hashSync(this.password, 8)
    }

    checkIfUnencryptedPasswordIsValid (unencryptedPassword: string) {
      return bcrypt.compareSync(unencryptedPassword, this.password)
    }
}
