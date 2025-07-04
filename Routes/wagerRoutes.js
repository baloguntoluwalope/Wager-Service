import { Authenticated } from "../Middlewares/Auth.js"
import express from "express"
import { acceptWager, createWager, declineWager, getAllWagers, getAllWagerTransactions, getWager, getWagerByUser, getWagerTransaction, gradeWager, respondToWager, updateWager } from "../Controllers/wagerController.js"
import { attachUserWallet, ensureCompanyWalletExists } from "../Middlewares/wallet.js"
// import { attachUserWallet } from "../Middlewares/wallet.js"


const router = express.Router()

// create wager
router.post('/createWager',Authenticated,attachUserWallet,ensureCompanyWalletExists,createWager)

// Get all wager
router.get('/get',Authenticated,getAllWagers)

// get a wager
router.get('/getWager/:wagerId',Authenticated,getWager)

router.get('/getAll',Authenticated,getAllWagerTransactions)


// get by user
router.get('/getByUser',Authenticated,getWagerByUser)

// Get  A Wager Transaction
router.get('/transaction/:id',Authenticated,getWagerTransaction)

// Accept wager
router.put('/accept/:wagerTransactionId',Authenticated,acceptWager)

// respond
router.put('/respond/:wagerTransactionId',Authenticated,respondToWager)

// decline wager
router.put('/decline/:wagerTransactionId',Authenticated,declineWager)

// grade wager
router.put('/grade/:wagerTransactionId',Authenticated,gradeWager)


// update wager
router.put('/update/:wagerId',Authenticated,updateWager)

export default router