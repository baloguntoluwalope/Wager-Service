import express from "express";
import mongoose from "mongoose";
import bodyParser from 'express';
import dotenv from 'dotenv';
dotenv.config();
import cron from "node-cron"
import nodemailer from 'nodemailer'
import userRouter from './Routes/userRoutes.js'
import wagerRouter from './Routes/wagerRoutes.js'
import walletRouter from './Routes/walletRoutes.js'
import companyWallet from './Routes/companyWalletRoutes.js'
import { dbconnect } from "./config/dbconnect.js";

const app = express();

app.use(bodyParser.json())

// database connection
dbconnect()

// home testing route
app.get('/',(req,res)=>res.json({message:"This is home route"}))

// user Register
app.use('/api/user',userRouter)

// wager
app.use('/api/wager',wagerRouter)

// walllet
app.use('/api/wallet',walletRouter)

// companyWallet
app.use('/api/wallet',companyWallet)







// calling sendMail()
// cron.schedule('*/5 * * * * *', function () {
//   console.log('Running cron job every 5 seconds');
//   sendMail();
// });


// send Mail function using
function sendMail() {
 let mailTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: `${process.env.EMAILFROM}`,
      pass: `${process.env.EMAILPASSWORD}`
    }
  });


  // setting credentials
  let mailDetails = {
    from: `${process.env.EMAILFROM}`,
    to: `${process.env.EMAILTO}`,
    subject: `Weekly Reminder`,
    text: `Apply for jobs`,
  };

  // sending Email
  mailTransporter.sendMail(mailDetails, function(err, data) {
    if (err) {
      console.log('Error Occurs', err);
    } else {
      console.log('Email Sent Successfully');
    }
  });
}






const port = process.env.PORT;
app.listen(process.env.PORT, () => {
  console.log(`Server is running on http://localhost:${port}`);
});