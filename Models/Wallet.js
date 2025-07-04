import mongoose from "mongoose";

const userWalletSchema = new mongoose.Schema({
  balance: { type: Number, require: true },
  userId: { type: String, require: true },
  updatedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, default: Date.now },
});

export const UserWallet = mongoose.model('UserWallet', userWalletSchema);