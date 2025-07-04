import express from "express"
import { getAllUser,  getUser,  login, register } from "../Controllers/userController.js"

const router = express.Router()

// register user
router.post('/register',register) //=> /api/user/register

// login user
router.post('/login',login)  //=> /api/user/login

router.get('/getUser',getAllUser)

router.get('/getUser/:userId',getUser)



export default router