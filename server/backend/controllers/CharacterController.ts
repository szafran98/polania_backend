import { Request, Response } from 'express';
import { getMongoManager, getRepository } from 'typeorm';
import { ObjectID } from 'mongodb';
import { User } from '../entity/User';
import Character from '../entity/Character';
import Stats from '../entity/Stats';

export default class CharacterController {
    static listAllUserCharacters = async (req: Request, res: Response) => {
        const id: string = req.params.id;

        //Get users from database
        const userRepository = getRepository(User);
        try {
            const userCharacters = await userRepository.findOneOrFail(id, {
                select: ['id', 'characters'],
            });
            console.log(userCharacters);
            res.send(userCharacters);
        } catch (e) {
            res.status(404).send('User not found');
        }
    };

    static loginInGameCharacter = async (req: Request, res: Response) => {
        let characterName = req.body.characterName;

        const characterRepository = getRepository(Character);
        const userRepository = getRepository(User);

        try {
            /*
            const manager = getMongoManager();
            const userCharacter = await manager.find({
                //@ts-ignore
                'characters.name': characterName,
            });

             */

            const userCharacter = await characterRepository.findOne({
                name: characterName,
            });
            //console.log(userCharacter);

            console.log(userCharacter);
            res.send(userCharacter);
        } catch (e) {
            res.status(404).send('Character not found');
        }
    };

    static createNewCharacter = async (req: Request, res: Response) => {
        let middlePayload = JSON.stringify(req.headers.auth).split('.')[1];
        //console.log;
        middlePayload = new Buffer(middlePayload, 'base64').toString('ascii');

        let userId = JSON.parse(middlePayload).userId;
        let characterName = req.body.name;

        const characterRepository = getRepository(Character);
        const userRepository = getRepository(User);

        try {
            let user = await userRepository.findOneOrFail(userId);
            //console.log(user);

            let newCharacter = new Character();
            newCharacter.name = characterName;
            newCharacter.x = 256;
            newCharacter.y = 256;
            newCharacter.currentDirection = 0;
            newCharacter.imageSrc = 'm_pal28.png';
            newCharacter.ownedItemsIds = []
            newCharacter.statistics = new Stats();
            newCharacter.statistics.attack = [7, 9];
            newCharacter.statistics.attackSpeed = 1;
            newCharacter.statistics.criticalStrikeChance = 1;
            newCharacter.statistics.criticalStrikePower = 1;
            newCharacter.statistics.strength = 3;
            newCharacter.statistics.dexterity = 3;
            newCharacter.statistics.intellect = 3;
            newCharacter.statistics.energy = 0;
            newCharacter.statistics.mana = 0;
            newCharacter.statistics.fireResistance = 0;
            newCharacter.statistics.frostResistance = 0;
            newCharacter.statistics.lightningResistance = 0;
            newCharacter.statistics.poisonResistance = 0;
            newCharacter.statistics.armor = 10;
            newCharacter.statistics.health = 35;
            newCharacter.statistics.dodge = 0;
            newCharacter.statistics.level = 1;
            newCharacter.statistics.experience = 0;

            //await newCharacter.save();

            await newCharacter.save();

            let manager = getMongoManager();
            await manager.updateOne(
                User,
                { _id: ObjectID(userId) },
                {
                    $push: {
                        characters: newCharacter,
                    },
                }
            );

            res.status(201).send('Postać zostałą utworzona');

            //await user.save();
        } catch (e) {
            res.status(404).send('Nie znaleziono');
        }
    };
}
