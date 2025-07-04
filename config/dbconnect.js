import mongoose from "mongoose";
import dotenv from 'dotenv';
dotenv.config();

export const dbconnect = async () => {
    try {
          mongoose
  .connect(process.env.MONGODB_URI, {
    
  })
  .then(() => console.log("MongoDB Connected Successfully.....!"))
 
    } catch (error) {
       console.log (error) 
    }
}