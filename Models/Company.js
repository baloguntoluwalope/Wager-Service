import mongoose from "mongoose";

const companySchema = new mongoose.Schema({
  name: { type: String, require: true },
  role: {
    type: String,
    enum: [ "admin"], 
    default: "admin",
  },
  createdAt: { type: Date, default: Date.now },
});

export const Company = mongoose.model("Company", companySchema);