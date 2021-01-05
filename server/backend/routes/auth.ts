import { Router } from 'express'
import AuthController from '../controllers/AuthController'
import { checkJwt } from '../middlewares/checkJwt'
import cors from 'cors'

const router = Router()
router.post('/login', cors(), AuthController.login)

router.post('/change-password', [checkJwt], AuthController.changePassword)

export default router
