import mongoose from "mongoose";

const ledgerWalletSchema = new mongoose.Schema({
  companyId: { type: String, require: true },
  oldBalance: { type: Number, require: true },
  newBalance: { type: Number, require: true },
  updatedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, default: Date.now },
});

export const LedgerWallet = mongoose.model('LedgerWallet', ledgerWalletSchema);