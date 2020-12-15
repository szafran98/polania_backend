import { IStats } from '../../../../Interfaces';
import { Equipment } from './Equipment';
import { Statistic } from '../../Enums';

export default class Statistics {
    _baseStats: IStats = {
        attack: 3,
        attackSpeed: 1.0,
        criticalStrikeChance: 1.0,
        criticalStrikePower: 1.0,
        strength: 3,
        dexterity: 3,
        intellect: 3,
        energy: 0,
        mana: 0,
        fireResistance: 0,
        frostResistance: 0,
        lightningResistance: 0,
        poisonResistance: 0,
        armor: 0,
        dodge: 0,
        maxHealth: undefined,
    };
    _level: number = 1;
    _experience: number = 0;
    _health: number;

    equipment: Equipment = new Equipment(Object.create(null));

    constructor(statsData: IStats | any) {
        console.log(statsData);
        console.log('stats data ^^^^^^^^');
        this._baseStats.attack = statsData.attack;
        this._baseStats.attackSpeed = statsData.attackSpeed;
        this._baseStats.criticalStrikeChance = statsData.criticalStrikeChance;
        this._baseStats.criticalStrikePower = statsData.criticalStrikePower;
        this._baseStats.strength = statsData.strength;
        this._baseStats.dexterity = statsData.dexterity;
        this._baseStats.intellect = statsData.intellect;
        this._baseStats.energy = statsData.energy;
        this._baseStats.mana = statsData.mana;
        this._baseStats.fireResistance = statsData.fireResistance;
        this._baseStats.frostResistance = statsData.frostResistance;
        this._baseStats.lightningResistance = statsData.lightningResistance;
        this._baseStats.poisonResistance = statsData.poisonResistance;
        this._baseStats.armor = statsData.armor;
        this._baseStats.dodge = statsData.dodge;
        this.health = statsData.health;
        this._level = statsData.level;
        this._experience = statsData.experience;
        //this._baseStats = statsData;
        this._baseStats.maxHealth = this.calculateMaxHealth();
    }

    /*
    constructor() {
        // POCZĄTKOWE ŻYCIE WYNIKAJĄCE WYŁĄCZNIE Z POZIOMU + 5 HP ZA KAŻDY PUNKT SIŁY + PRZELICZNIK WOJOWNIKA

        this._baseStats.maxHealth = Math.floor(
            20 * Math.pow(this._level, 1.25) +
                <number>this._baseStats.strength * 5 +
                this._level * 0.1 * <number>this._baseStats.strength
        );
        this._health = this.maxHealth;
    }

     */

    get criticalStrikePower() {
        return <number>this.allStatistics.strength / (this._level / 2) / 100;
    }

    get allStatistics() {
        let combinedStats: IStats = {};

        Object.values(Statistic).forEach((stat) => {
            if (this.equipment.equipmentStats[stat]) {
                if (stat === Statistic.ATTACK) {
                    combinedStats[stat] = this.equipment.equipmentStats[stat];
                } else {
                    combinedStats[stat] =
                        <number>this._baseStats[stat] +
                        <number>this.equipment.equipmentStats[stat];
                }
            } else {
                combinedStats[stat] = <number>this._baseStats[stat];
            }
        });
        return combinedStats;
    }

    get SA() {
        let base = <number>this.allStatistics.attackSpeed;
        for (let i = 3; i < 100; i++) {
            if (i <= <number>this._baseStats.dexterity) {
                base += 0.02;
            }
        }
        return base;
    }

    get AT() {
        return 1 / (<number>this.SA + 1);
    }

    get maxHealth() {
        return <number>this.allStatistics.maxHealth;
    }

    set maxHealth(maxHealthValue) {
        this._baseStats.maxHealth = maxHealthValue;
    }

    get health() {
        return this._health;
    }

    set health(value: number) {
        this._health = value;
    }

    get generateHit() {
        let attack = this.allStatistics.attack;
        if (typeof attack === 'number') {
            return attack;
        } else if (Array.isArray(attack)) {
            return Math.floor(
                Math.random() * (attack[1] - attack[0]) + attack[0]
            );
        }
    }

    get isHitCritical() {
        let diceThrow = Math.floor(Math.random() * 100);
        return (
            diceThrow <= <number>this.allStatistics.criticalStrikeChance + 20
        );
    }

    calculateMaxHealth() {
        return Math.floor(
            20 * Math.pow(this._level, 1.25) +
                <number>this.allStatistics.strength * 5 +
                this._level * 0.1 * <number>this.allStatistics.strength
        );
    }
}
