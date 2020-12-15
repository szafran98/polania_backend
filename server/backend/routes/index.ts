import { Router, Request, Response } from 'express';
import auth from './auth';
import user from './user';
import character from './character';

const routes = Router();

routes.use('/auth', auth);
routes.use('/user', user);
routes.use('/character', character);

export default routes;
