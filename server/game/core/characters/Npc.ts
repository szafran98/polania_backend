import { INpc } from "../../../../Interfaces";


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
        this.databaseId = data.databaseId

        console.log(this)
    }
}