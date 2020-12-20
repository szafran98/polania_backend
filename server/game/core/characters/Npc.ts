import {ICollisionEntity, INpc} from "../../../../Interfaces";


export default class Npc implements INpc {
    id: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    imageSrc: string
    conversationOptions: object
    conversationOptionsTree: object
    databaseId: string

    constructor(data: INpc) {
        this.id = data.id
        this.name = data.name
        this.x = data.x
        this.y = data.y
        this.width = data.width
        this.height = data.height
        this.imageSrc = data.imageSrc
        this.conversationOptions = data.conversationOptions
        this.conversationOptionsTree = data.conversationOptionsTree
        this.databaseId = data.databaseId

        console.log(this)
    }

    get collider(): ICollisionEntity {
        return {
            x1: this.x,
            x2: this.x + this.width,
            y1: this.y,
            y2: this.y + this.height,
        };
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
        } else if (this.width === 32 && this.height === 64) {
            return [{
                x1: this.x,
                x2: this.x + this.width,
                y1: this.y,
                y2: this.y + this.height / 2,
            }]
        } else {
            return [this.collider];
        }
    }
}