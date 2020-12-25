export enum Scene {
    WALK = 'WALK',
    FIGHT = 'FIGHT',
}

export enum ObjectType {
    ENEMY = 'enemy',
    NPC = 'npc',
    ITEM = 'item',
}

export enum Statistic {
    MAX_HEALTH = 'maxHealth',
    ATTACK = 'attack',
    ATTACK_SPEED = 'attackSpeed',
    CRITICAL_STRIKE_CHANCE = 'criticalStrikeChance',
    CRITICAL_STRIKE_POWER = 'criticalStrikePower',
    STRENGTH = 'strength',
    DEXTERITY = 'dexterity',
    INTELLECT = 'intellect',
    ENERGY = 'energy',
    MANA = 'mana',
    ARMOR = 'armor',
    DODGE = 'dodge',
}

export enum ItemType {
    HELMET = 'helmet',
    ARMOR = 'armor',
    WEAPON = 'weapon',
    GLOVES = 'gloves',
    BOOTS = 'boots',
    RING = 'ring',
    AMULET = 'amulet',
    CONSUMABLE = 'consumable'
    //BACKPACK = 'backpack',
}

export enum CombatType {
    PVE,
    PVP,
}

export enum Class {
    WARRIOR = 'warrior',
    MAGE = 'mage',
    HUNTER = 'hunter',
}
