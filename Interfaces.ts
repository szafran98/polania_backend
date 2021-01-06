import Enemy from './server/game/core/characters/Enemy';
import { Class, ItemType } from './server/game/Enums';
import Npc from './server/game/core/characters/Npc';
import { ObjectID } from 'mongodb';

export interface IReceivedMap {
    compressionlevel: number;
    editorsettings: any;
    height: number;
    infinite: boolean;
    layers: (IMapDrawableLayer | IMapObjectLayer)[];
    nextlayerid: number;
    nextobjectid: number;
    orientation: string;
    renderorder: string;
    tiledversion: string;
    tileheight: number;
    tilewidth: number;
    tilesets: ITileset[];
    type: 'map';
    version: number;
    width: number;
}

export interface IMapDrawableLayer {
    data: number[];
    height: number;
    id: number;
    name: string;
    opacity: number;
    type: 'tilelayer';
    visible: true;
    width: number;
    x: number;
    y: number;
}

export interface IMapObjectLayer {
    draworder: string;
    id: number;
    name: string;
    objects: IObjectLayerEntity[];
    opacity: number;
    type: 'objectgroup';
    visible: boolean;
    x: number;
    y: number;
}

interface IObjectLayerEntity {
    height: number;
    id: number;
    name: string;
    rotation: number;
    type: 'enemy' | 'npc' | 'item';
    visible: boolean;
    width: number;
    x: number;
    y: number;
}

interface ITileset {
    columns: number;
    firstgid: number;
    image: string;
    imageheight: number;
    imagewidth: number;
    margin: number;
    name: string;
    spacing: number;
    tilecount: number;
    tileheight: number;
    tilewidth: number;
    tiles: ITile[];
}

export interface ITile {
    id: number;
    objectgroup: {
        draworder: string;
        name: string;
        objects: [
            {
                height: number;
                id: number;
                name: string;
                rotation: number;
                type: string;
                visible: boolean;
                width: number;
                x: number;
                y: number;
            }
        ];
        opacity: number;
        type: string;
        visible: boolean;
        x: number;
        y: number;
    };
}

export interface IItem {
    id: string;
    name: string;
    type: ItemType;
    imageSrc?: string;
    statistics: IStats;
    class: Class;
    value: number;
    requiredLevel: number;
}

export interface IStats {
    maxHealth?: number;
    health?: number;
    attack?: number[] | number;
    attackSpeed?: number;
    criticalStrikeChance?: number;
    criticalStrikePower?: number;
    strength?: number;
    dexterity?: number;
    intellect?: number;
    energy?: number;
    mana?: number;
    fireResistance?: 0;
    frostResistance?: 0;
    lightningResistance?: 0;
    poisonResistance?: 0;
    armor?: number;
    dodge?: number;
    level?: number;
    experience?: number;
}

export interface IEntity {
    id: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    visible: boolean;
    imageSrc: string;
    statistics: any;
    positionOnGrid?: any;
    target?: any;
    _group?: any;
}

export interface IPlayer extends IEntity {
    hasMoved: boolean;
    currentDirection: number;
    lastDirection?: number;
    frameCount: number;
    currentLoopIndex: number;
    maxSpeed?: number;
    socketId: string;
    pressingRight?: boolean;
    pressingLeft?: boolean;
    pressingUp?: boolean;
    pressingDown?: boolean;
    mapData?: any;
    gold: number;
    class: Class;
}

export interface IEnemy extends IEntity {
    spawnTime: number;
    databaseId: string;
}

export interface ICollisionEntity {
    x1: number;
    x2: number;
    y1: number;
    y2: number;
}

export interface IMapData {
    collisionMap: ICollisionEntity[];
    tilesToCollide: number[];
    isMapLoaded: boolean;
    mapLayersData: number[][];
    enemiesOnMap: Enemy[];
    npcsOnMap: Npc[];
    itemsOnMap: any[];
    world: IMapWorld;
    imageSrc: string;
}

export interface IMapWorld {
    map: number[][];
    columns: any;
    height: number;
    width: number;
}

export interface IEquipment {
    helmet: IItem;
    ring: IItem;
    gloves: IItem;
    amulet: IItem;
    weapon: IItem;
    armor: IItem;
    boots: IItem;
    backpack: IItem[];
}

export interface INpc {
    id: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    imageSrc: string;
    offeringItems: any[];
    conversationOptions: object;
    conversationOptionsTree: object;
    databaseId: string;
}

export interface IOwnedItem {
    id: ObjectID;
    itemData: IItem;
    fieldInEquipment?: string;
}
