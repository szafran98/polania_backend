import * as map from '../../../public/city.json';
import Enemy from './characters/Enemy';

import EnemyExample from '../../backend/entity/EnemyExample';
import {
    IMapData,
    IMapDrawableLayer,
    IMapObjectLayer,
    IReceivedMap,
    ICollisionEntity,
    IMapWorld,
} from '../../../Interfaces';
import NonPlayableCharacter from "../../backend/entity/NonPlayableCharacter";
import Npc from "./characters/Npc";

export default class Map {
    mapData: any;
    collisionMap: ICollisionEntity[] = [];
    _tilesToCollide: number[];
    tile_sheet = {
        columns: 0,
        tile_height: 32,
        tile_width: 32,
    };

    isMapLoaded = true;
    mapLayersData: number[][] = [];
    enemiesOnMap: Enemy[] = [];
    killedEnemies: Enemy[] = [];
    npcsOnMap: Npc[] = []
    itemsOnMap: any[] = [];

    constructor() {
        this.mapData = map;
        this.initializeMap();
        this.enemySpawner();
    }

    get mapDataToEmit(): IMapData {
        return <IMapData>{
            collisionMap: this.collisionMap,
            tilesToCollide: this.tilesToCollide,
            isMapLoaded: this.isMapLoaded,
            mapLayersData: this.mapLayersData,
            enemiesOnMap: this.enemiesOnMap,
            npcsOnMap: this.npcsOnMap,
            itemsOnMap: this.itemsOnMap,
            world: <IMapWorld>{
                map: this.mapLayersData,
                columns: this.mapData.width,
                height: this.mapData.height * this.tile_sheet.tile_height,
                width: this.mapData.width * this.tile_sheet.tile_width,
            },
            imageSrc: `./img/${this.mapData.tilesets[0].name}.png`,
        };
    }

    get world(): IMapWorld {
        return {
            map: this.mapLayersData,
            columns: this.mapData.width,
            height: this.mapData.height * this.tile_sheet.tile_height,
            width: this.mapData.width * this.tile_sheet.tile_width,
        };
    }

    get tilesToCollide() {
        return this._tilesToCollide;
    }

    initializeMap(): void {
        this.readMap();
        this.createCollisions();
    }

    enemySpawner(): void {
        setInterval(() => {
            this.killedEnemies.forEach((enemy) => {
                enemy.spawnTime--;
                if (enemy.spawnTime === 0) {
                    //console.log(enemy)
                    this.spawnEnemyOnMap(enemy);
                }
            });
        }, 1000);
    }

    spawnEnemyOnMap(enemyData: Enemy): void {
        EnemyExample.findOne(enemyData.databaseId).then((res) => {
            //let response: object = Object.assign(res);
            let response: any = Object.assign(res!);
            response.databaseId = response!.id.toString();
            response.x = enemyData.x;
            response.y = enemyData.y;
            response.id = enemyData.id;

            let enemy = new Enemy(response);
            this.enemiesOnMap.push(enemy);
            this.createObjectCollision(enemy);
        });
    }

    setTilesToCollide(): void {
        let tilesToCollide: number[] = [];
        this.mapData.tilesets.forEach((tileset: any) => {
            tileset.tiles.forEach((data: { id: number }) => {
                tilesToCollide.push(data.id);
            });
        });
        this._tilesToCollide = tilesToCollide;
    }

    readMap(): void {
        this.mapData.layers.forEach((layer: any) => {
            if (layer.type === 'objectgroup') {
                this.readObjectLayers(layer).then(() =>
                    this.initializeEnemiesGroups(layer)
                );
            } else if (layer.type === 'tilelayer') {
                this.readMapLayers(layer);
            }
        });

        this.setTilesToCollide();
    }

    readMapLayers(drawableLayer: IMapDrawableLayer): void {
        this.mapLayersData.push(drawableLayer.data);
    }

    readObjectLayers(objectLayer: IMapObjectLayer): Promise<void> {
        return new Promise((resolve) => {
            objectLayer.objects.forEach(
                (value: any, index: any, array: any) => {
                    // READ ENEMIES OBJECTS DATA
                    if (value.type === 'enemy') {
                        EnemyExample.findOne(value.properties[0].value).then(
                            (res) => {
                                let response: any = Object.assign(res);
                                response.databaseId = response!.id.toString();
                                response.x = value.x;
                                response.y = value.y;
                                response.id = value.id;

                                let enemy = new Enemy(response);
                                this.enemiesOnMap.push(enemy);
                                this.createObjectCollision(enemy);
                                if (index === array.length - 1) resolve();
                            }
                        );
                    } else if (value.type === 'npc') {
                        //console.log(value)
                        NonPlayableCharacter.findOne(value.properties[0].value).then(
                            res => {
                                let response: any = Object.assign(res!)
                                response.databaseId = response!.id.toString();
                                response.x = value.x;
                                response.y = value.y;
                                response.width = value.width
                                response.height = value.height
                                response.id = value.id;

                                let npc = new Npc(response)
                                this.npcsOnMap.push(npc)
                                this.createObjectCollision(npc)
                                if (index === array.length - 1) resolve();
                            }
                        )
                    }
                }
            );
        });
    }

    initializeEnemiesGroups(objectLayer: IMapObjectLayer): void {
        this.enemiesOnMap.forEach((enemy) => {
            objectLayer.objects.forEach((object: any) => {
                if (object.type === 'enemy') {
                    if (object.id === enemy.id) {
                        object.properties.forEach((property: any) => {
                            if (property.name === 'groupWith') {
                                enemy._group.push(property.value);
                            }
                        });
                    }
                }
            });
        });
    }

    createCollisions(): void {
        this.createMapCollisions();
        this.isMapLoaded = true;
    }

    createObjectCollision(entity: Enemy | Npc): void {
        let collisionMap = entity.collisionMap;
        if (collisionMap instanceof Array) {
            this.collisionMap.push(...collisionMap);
        } else {
            this.collisionMap.push(collisionMap);
        }
    }

    createMapCollisions(): void {
        for (let i in this.world.map) {
            for (
                let index = this.world.map[i].length - 1;
                index > -1;
                index--
            ) {
                let destination_x =
                    (index % this.world.columns) * this.tile_sheet.tile_width;
                let destination_y =
                    Math.floor(index / this.world.columns) *
                    this.tile_sheet.tile_height;

                this.tilesToCollide.forEach((tile: number) => {
                    if (this.world.map[i][index] === tile + 1) {
                        let collisionTile: ICollisionEntity = {
                            x1: destination_x,
                            x2: destination_x + 32,
                            y1: destination_y,
                            y2: destination_y + 32,
                        };
                        this.collisionMap.push(collisionTile);
                    }
                });
            }
        }
    }

    removeKilledEnemiesFromMap(enemiesList: Enemy[]): void {
        enemiesList.forEach((killedEnemy) => {
            this.enemiesOnMap.forEach((enemy) => {
                if (enemy.id === killedEnemy.id) {
                    let killedEnemyId = this.enemiesOnMap.indexOf(enemy);

                    this.killedEnemies.push(enemy);

                    delete this.enemiesOnMap[killedEnemyId];
                }
            });
        });
        this.enemiesOnMap = this.enemiesOnMap.filter((enemy) => {
            return typeof enemy !== 'undefined';
        });
        this.removeKilledEnemiesCollisions(enemiesList);
    }

    removeKilledEnemiesCollisions(enemiesList: Enemy[]): void {
        this.collisionMap.forEach((collider) => {
            enemiesList.forEach((enemyCollider) => {
                let colliders = <Array<any>>enemyCollider.collisionMap;
                colliders.forEach((col) => {
                    if (
                        collider.x1 === col.x1 &&
                        collider.x2 === col.x2 &&
                        collider.y1 === col.y1 &&
                        collider.y2 === col.y2
                    ) {
                        let colliderId = this.collisionMap.indexOf(collider);
                        delete this.collisionMap[colliderId];
                    }
                });
            });
        });
    }
}
