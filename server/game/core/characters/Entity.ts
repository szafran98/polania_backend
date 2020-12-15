import Statistics from './Statistics';
import { IEntity } from '../../../../Interfaces';
import { game } from '../../../../app';
import { ICollisionEntity } from '../../../../Interfaces';

export default class Entity implements IEntity {
    id: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    visible: boolean;
    statistics: Statistics;
    _positionOnGrid: number[] = null;
    imageSrc: string;

    target!: Entity;

    _group: number[] = [];

    constructor(data: IEntity) {
        this.id = data.id;
        this.name = data.name;
        this.x = data.x;
        this.y = data.y;
        this.width = data.width || 32;
        this.height = data.height || 32;
        this.visible = data.visible;
        this.imageSrc = data.imageSrc;
        this.statistics = new Statistics(data.statistics);
    }

    get healthBarPosition(): object {
        return {
            x: this._positionOnGrid[0],
            y: this._positionOnGrid[1],
        };
    }

    set positionOnGrid(positionOnGrid: number[]) {
        this._positionOnGrid = positionOnGrid;
    }

    get positionOnGrid(): number[] {
        return this._positionOnGrid;
    }

    get mapCoordinates(): object {
        return {
            x: Math.floor(this.x / 32),
            y: Math.floor(this.y / 32),
        };
    }

    get collider(): ICollisionEntity {
        return {
            x1: this.x,
            x2: this.x + this.width,
            y1: this.y,
            y2: this.y + this.height,
        };
    }

    attack(enemy: Entity): number {
        let trueDamage;
        let generatedHit = this.statistics.generateHit;
        if (this.statistics.isHitCritical) {
            let additionalDamage =
                <number>generatedHit * this.statistics.criticalStrikePower;
            trueDamage = Math.floor(
                <number>generatedHit +
                    additionalDamage * 2 -
                    <number>generatedHit *
                        ((<number>enemy.statistics.allStatistics.armor * 0.5) /
                            100)
            );
            enemy.statistics._health -= trueDamage;
        } else {
            trueDamage = Math.floor(
                <number>generatedHit -
                    <number>generatedHit *
                        ((<number>enemy.statistics.allStatistics.armor * 0.5) /
                            100)
            );
            enemy.statistics._health -= trueDamage;
        }
        return trueDamage;
    }

    moveForward(): boolean {
        let isMoveDone = false;
        game.ACTUAL_COMBATS_LIST.forEach((combat) => {
            for (let i = 0; i < combat.actualGridPresentation.length; i++) {
                combat.actualGridPresentation[i].forEach((field) => {
                    if (
                        field.hasOwnProperty('entity') &&
                        field.entity.id === this.id &&
                        !isMoveDone
                    ) {
                        let index = combat.actualGridPresentation[i].indexOf(
                            field
                        );

                        let gridObject = field;

                        if (i === 0) {
                            if (
                                !combat.actualGridPresentation[i + 1][
                                    index
                                ].hasOwnProperty('entity')
                            ) {
                                gridObject.coords[1] += 50;
                                combat.actualGridPresentation[i + 1][
                                    index
                                ] = gridObject;

                                combat.actualGridPresentation[i][index] = {};

                                isMoveDone = true;
                            }
                        } else if (i === 2) {
                            if (
                                !combat.actualGridPresentation[i - 1][
                                    index
                                ].hasOwnProperty('entity')
                            ) {
                                gridObject.coords[1] -= 50;
                                combat.actualGridPresentation[i - 1][
                                    index
                                ] = gridObject;

                                combat.actualGridPresentation[i][index] = {};

                                isMoveDone = true;
                            }
                        }
                    }
                });
            }

            if (isMoveDone) {
                combat.playersSockets.forEach((socket) => {
                    socket.emit('entityMoved', {
                        entity: combat.activeEntity,
                        fightId: combat.fightId,
                    });
                });
            }
        });

        return isMoveDone;
    }
}
