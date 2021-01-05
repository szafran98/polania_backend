import { BaseEntity, Column, Entity, ObjectID, ObjectIdColumn } from 'typeorm'
import Stats from './Stats'

@Entity()
export default class EnemyExample extends BaseEntity {
    @ObjectIdColumn()
    id!: ObjectID;

    @Column()
    mapId!: number;

    @Column()
    name!: string;

    @Column()
    height!: number;

    @Column()
    width!: number;

    @Column()
    type!: string;

    @Column()
    imageSrc!: string;

    @Column()
    spawnTime!: number;

    @Column()
    x!: number;

    @Column()
    y!: number;

    @Column((type) => Stats)
    statistics!: Stats;

    static findByMapId (mapId: number) {
      return this.findOne({ mapId: mapId })
    }
}
