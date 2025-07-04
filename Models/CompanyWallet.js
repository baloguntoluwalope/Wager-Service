import mongoose from "mongoose";

const companyWalletSchema = new mongoose.Schema({
  name: { type: String, require: true },
  balance: { type: Number, require: true },
  companyId: { type: String, require: true },
  createdAt: { type: Date, default: Date.now },
  
});

export const CompanyWallet = mongoose.model('CompanyWallet', companyWalletSchema);