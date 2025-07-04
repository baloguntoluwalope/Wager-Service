import mongoose from "mongoose";
import { UserWallet } from "../Models/Wallet.js";
import { CompanyWallet } from "../Models/CompanyWallet.js";
import { Company } from "../Models/Company.js";
import { Ledger } from "../Models/Ledger.js";
import { LedgerWallet } from "../Models/CompanyLedger.js";


export const register = async (req, res) => {
  const { name, role='admin', initialBalance = 1000000} = req.body;
  try {
    let company = await Company.findOne({ name });
    if (company)
      return res.json({
        message: "This Particular users exist",
        success: false,
      });
    

    company = await Company.create({ name,role,
    });

    let companyWallet = await CompanyWallet.findOne({ name });
    if (companyWallet) {
      return res
        .status(409)
        .json({ message: 'Wallet exist' });
    }

    companyWallet = await CompanyWallet.create({ companyId:company._id,
      balance:initialBalance
    });
   
    await companyWallet.save()
    res.json({ message: "Wallet created sucessfully....!", companyWallet,success: true });
  } catch (error) {
    res.json({ message: error.message });
  }
};


//get companyWalletBalance
export const getCompanyWalletBalance = async (req,res) => {
     const  companyId  = req.params.companyId; 
     console.log(companyId)
  try {
    const companyWallet = await CompanyWallet.findOne({ companyId });
  
    if (!companyWallet) {
      return res.status(404).json({ message: 'Company wallet not found' });
    }
    return res.json({ balance: companyWallet.balance, companyId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCompanyWalletTransactions = async (req,res)=>{
  try {
    const companyId = req.params.userId;
    const companyWallet = await CompanyWallet.findOne({ companyId });
    if (!companyWallet) {
      return res.status(404).json({ message: 'User wallet not found' });
    }
    res.json({ transactions: companyWallet.transactions });
  } catch (error) {
    
  }
}


 export const getLedgerBalance = async (req, res) => {
    try {
      const { companyId } = req.params; 
  
      if (!mongoose.Types.ObjectId.isValid(companyId)) {
        return res.status(400).json({ message: "Invalid companyId " });
      }
      const ledgerEntries = await LedgerWallet.findOne({companyId}).sort({ createdAt: 1 });
      console.log(ledgerEntries);
  
      if (!ledgerEntries || ledgerEntries.length === 0) {
        return res.status(404).json({ message: "Ledger entries not found for this user" });
      }
  
      
      // const currentBalance = ledgerEntries?.[ledgerEntries.length - 1].newBalance;
      let currentBalance;
if (ledgerEntries && ledgerEntries.length > 0) {
  currentBalance = ledgerEntries[ledgerEntries.length - 1].newBalance;
} else {
  currentBalance = 0; 
}
  
      res.status(200).json({
        message: "Ledger balance retrieved successfully",
        companyId,
        currentBalance,
        ledgerEntries, 
      });
    } catch (error) {
      console.error("Error getting ledger balance:", error);
      res.status(500).json({ message: "Failed to retrieve ledger balance", error: error.message });
    }
  }