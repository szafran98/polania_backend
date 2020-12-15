import Entity from './Entity';
import { IEnemy } from '../../../../Interfaces';

export default class Enemy extends Entity implements IEnemy {
    spawnTime: number;
    databaseId: string;

    constructor(data: IEnemy) {
        super(data);
        this.spawnTime = data.spawnTime;
        this.databaseId = data.databaseId;
    }

    get group(): number[] | number {
        if (this._group.length === 0) {
            return [parseInt(this.id)];
        } else {
            return this._group.push(parseInt(this.id));
        }
    }

    get collisionMap() {
        if (this.width === 64) {
            return [
                {
                    x1: this.x,
                    x2: this.x + this.width / 2,
                    y1: this.y,
                    y2: this.y + this.height / 2,
                },
                {
                    x1: this.x + this.width / 2,
                    x2: this.x + this.width,
                    y1: this.y,
                    y2: this.y + this.height / 2,
                },
            ];
        } else {
            return [this.collider];
        }
    }

    /*
    attack(enemy: Entity): void {
        return super.attack(enemy);
    }

     */

    chooseTarget(enemies: Entity[]): void {
        this.target = enemies[Math.floor(Math.random() * enemies.length)];
    }
}
