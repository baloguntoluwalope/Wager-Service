import express from "express"
import { Authenticated } from "../Middlewares/Auth.js"
import {  creditWallet, getAllUserWallet, getBalance, getLedgerBalance, getUserWalletTransactions, } from "../Controllers/walletController.js"
// import { getBalance } from "../Controllers/user.js"


const router = express.Router()



// router.post('/create',Authenticated, createWallet)

router.post('/creditWallet/:userId',Authenticated,creditWallet)

router.get('/ledger/:userId',getLedgerBalance)

router.get('/get',getAllUserWallet)

router.get('/get/:userId',getBalance)



router.get('/transaction/:userId',getUserWalletTransactions)





export default router