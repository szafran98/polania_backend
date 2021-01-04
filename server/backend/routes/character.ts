import { Router } from 'express';
import { checkJwt } from '../middlewares/checkJwt';
import CharacterController from '../controllers/CharacterController';

const router = Router();

router.get('/:id', [checkJwt], CharacterController.listAllUserCharacters);

router.post(
    '/getSelectedCharacter',
    [checkJwt],
    CharacterController.loginInGameCharacter
);

router.post('/create', [checkJwt], CharacterController.createNewCharacter);

export default router;
