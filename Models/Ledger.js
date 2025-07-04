import mongoose from "mongoose";

const ledgerSchema = new mongoose.Schema({
  userId: { type: String, require: true },
  oldBalance: { type: Number, require: true },
  newBalance: { type: Number, require: true },
  updatedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, default: Date.now },
});

export const Ledger = mongoose.model('Ledger', ledgerSchema);




