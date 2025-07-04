import { CompanyWallet } from "../Models/CompanyWallet.js";
import { UserWallet } from "../Models/Wallet.js";
import { User } from "../Models/User.js";



// const UserWallet = require('../models/UserWallet'); // Adjust the path if needed

export const attachUserWallet = async (req, res, next) => {
  const userId = req.user.id
  try {
    if ( userId) {
      const userWallet = await UserWallet.findOne({ userId: req.user.id });
      if (userWallet) {
        req.userWallet = userWallet;
      } else {
        //  Handle the case where a user doesn't have a wallet.
        //  You might want to create a wallet for them here, or return an error.
        return res.status(404).json({ message: "User wallet not found" }); //Or create new wallet
      }
    }
    next();
  } catch (error) {
    console.error("Error fetching user wallet:", error);
    return res.status(500).json({ message: "Failed to fetch user wallet" });
  }
};
// Middleware to check if the company wallet exists
export const ensureCompanyWalletExists = async (req, res, next) => {
    try {
        const companyId = req.params.companyId;
      const companyWallet = await CompanyWallet.findOne(companyId);
      if (!companyWallet) {
        // If the company wallet doesn't exist, create it
        const newCompanyWallet = new CompanyWallet({ balance: 0 });
        await newCompanyWallet.save();
        req.companyWallet = newCompanyWallet;
      } else {
        req.companyWallet = companyWallet;
      }
      next();
    } catch (error) {
      return res
        .status(500)
        .json({ message: 'Error checking/creating company wallet', error: error.message });
    }
  };