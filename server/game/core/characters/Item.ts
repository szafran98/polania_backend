import { IItem, IStats } from '../../../../Interfaces';
import { Class, ItemType } from '../../Enums';

export default class Item implements IItem {
    id: string;
    name: string;
    type: ItemType;
    statistics: IStats;
    class: Class;
    value: number;
    requiredLevel: number;
    imageSrc!: string;
    image!: HTMLImageElement;

    constructor(itemData: IItem) {
        this.id = itemData.id;
        this.name = itemData.name;
        this.type = itemData.type;
        this.statistics = itemData.statistics;
        this.class = itemData.class;
        this.value = itemData.value;
        this.requiredLevel = itemData.requiredLevel;
        if (itemData.imageSrc) {
            this.imageSrc = <string>itemData.imageSrc;
        }
    }
}
