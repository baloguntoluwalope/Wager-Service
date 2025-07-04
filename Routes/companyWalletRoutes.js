import express from "express";
import { getCompanyWalletBalance, getCompanyWalletTransactions, getLedgerBalance, register } from "../Controllers/companyWalletController.js";


const router = express.Router()

router.post("/createWallet",register)

router.get("/balance/:companyId",getCompanyWalletBalance)

router.get('/companyLedger/:companyId',getLedgerBalance)

router.get("/transaction/:companyId",getCompanyWalletTransactions)

export default router