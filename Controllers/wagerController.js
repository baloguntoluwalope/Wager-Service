import { Wager } from "../Models/Wager.js";
import { User } from "../Models/User.js";
import dotenv from 'dotenv';
dotenv.config();
import nodemailer from 'nodemailer'
import { WagerTransaction } from "../Models/wagerTransaction.js";
import { UserWallet } from "../Models/Wallet.js";
import { CompanyWallet } from "../Models/CompanyWallet.js";
import { Ledger } from "../Models/Ledger.js";
import { LedgerWallet } from "../Models/CompanyLedger.js";
import {sendEmail} from "../utilis/emailSender.js";

// create wager

export const createWager = async (req, res) => {
 
  try {
    const adProfile = await User.find({ role: `admin` });
    const adminDetails = adProfile[0];
    const adminUserName = adminDetails.userName;
    const userUserName = req.user.userName;
    const wagererId = req.params.userId;
    const userId = req.user.id;
    const wagerer = req.user.userName;
    const companyId = req.params.companyId;

    const wagererWallet = await UserWallet.findOne({ userId });

    if (!wagererWallet) {
      return res.status(404).json({ message: "User wallet not found" });
    }
     const {
    stake,
    title,
    description,
    wagerPosition,
    endDate,
    invites,
    acceptedBy,
    rejectedBy,
  } = req.body; 

    const actualInvites = invites.filter((invitee) => invitee !== userUserName && invitee !== adminUserName);

    if (actualInvites.includes(userUserName)) {
      return res.status(400).json("You cannot invite yourself when creating a wager.");
    }

     if (invites.includes(adminUserName)) {
      return res.status(400).json("You cannot invite an admin when creating a wager.");
    }
// const kkk = await User.find({
//       userName: { $in: invites.map((u) => u.toLowerCase()) },
//     }).select(`email name userName`);
//     console.log(kkk);
    if(stake < 0 ){
      return res.status(400).json({message:'negative values not accepted'})
    }

    const numberOfInvites = actualInvites.length;
    const totalStake = stake * numberOfInvites;

    if (wagererWallet.balance < totalStake) {
      return res
        .status(400)
        .json({ message: "Insufficient balance for wager" });
    }

   

    let oldWagererBalance = Number(wagererWallet.balance);
    wagererWallet.balance -= totalStake;
    await wagererWallet.save();
    await Ledger.create({
      userId: userId,
      oldBalance: oldWagererBalance,
      newBalance: wagererWallet.balance,
      balance: wagererWallet.balance,
    });

    const companyWallet = await CompanyWallet.findOne({ companyId });
    if (!companyWallet) {
      return res.status(404).json({ message: "Company wallet not found" });
    }

    let oldCompanyBalance = Number(companyWallet.balance);
    let currentCompanyBalance = Number(companyWallet.balance);
    if (isNaN(currentCompanyBalance)) {
      console.error(
        " ERROR: Company wallet balance is not a number:",
        companyWallet.balance
      );
      return res
        .status(500)
        .json({ message: "ERROR: Company wallet has invalid balance" });
    }
    
    companyWallet.balance = currentCompanyBalance + totalStake;
    await companyWallet.save();
    await LedgerWallet.create({
      companyId: companyWallet._id,
      oldBalance: oldCompanyBalance,
      newBalance: companyWallet.balance,
      balance: companyWallet.balance,
    });

    const wager = await Wager.create({
      title,
      description,
      wagerPosition,
      stake,
      wagererId: userId,
      wagerer: userUserName,
      invites,
      acceptedBy,
      rejectedBy,
      endDate,
    });

    if (!wager) {
      return res
        .status(404)
        .json({ message: "Error occurred while creating wager" });
    }

    let successfulTx = [];
    let failedTx = [];

    for (let i = 0; i < invites.length; i++) {
      const taker = await User.findOne({
        userName: invites[i],
      });
      if (!taker) {
        failedTx.push(invites[i]);
        continue;
      }

      await WagerTransaction.create({
        wagerId: wager._id,
        title,
        description,
        wagerPosition: wagerPosition,
        takerPosition: !wagerPosition,
        stake,
        wagererId: userId,
        wagerer: userUserName,
        takerId: taker._id,
        taker: taker.userName,
        endDate,
      });
      successfulTx.push(taker._id);
    }

   if (!Array.isArray(invites) || invites.length === 0) {
    return res.status(400).json({ message: 'No username found or invites is not a valid array.' });
}
// If you reach this point, invites is guaranteed to be a non-empty array.
    const userFound = await User.findOne().select('email name userName')
    const userFoundInDb = [userFound];
    const emailSub = `${title}`;
    const emailText = (user) =>
      `Hi ${user},\n\n Check out this wager you just created\n\nBest regards,\n<strong>Admin</strong>`;
    const emailTemplate = (user) => `
              <p>Hi<strong>${user}</strong></p>
              <p>You have successfully created a wager titled <strong>${title}</strong></p>
              <p>Visit our website to learn more about your wagger <strong>${title}</strong><a>"http://www.flashscore.com.ng"</a></p>
              <p>Best regards,</P>
              <p><strong>Admin</strong></p>
`;
let sentEmailCount = 0;
const processedUsername = new Set();
const emailPromise = userFoundInDb.map(async(user)=>{
  processedUsername.add(user.userName.toLowerCase());
      try {
        const useName = user.name || user.userName;
        const contentHtml = emailTemplate(useName);
        const contentText = emailText(useName);
        await sendEmail(user.email, emailSub, contentText, contentHtml);
        sentEmailCount++;
      } catch (emailError) {
        console.error(
          `Failed to send email to ${user.email} (SMTP error):`,
          emailError.message
        );
      }
    });
    await Promise.allSettled(emailPromise);
    const invitesFoundInDb = await User.find({
      userName: { $in: invites.map((u) => u.toLowerCase()) },
    }).select(`email name userName`);
    if (invitesFoundInDb.length === 0) {
      return res.status(404).json({ message: `No user found.` });
    }
    const emailSubject = `${title}`;
    const emailPlainText = (user) =>
      `Hi ${user},\n\nCheck out this wager\n\nBest regards,\n<strong>${userUserName}</strong>`;
    const emailHtmlTemplate = (user) => `
                <p>Hi <strong>${user}</strong>,</p>
                <p><strong>${userUserName}</strong> has created a wager <strong>${title}</strong> and you have been invited to participate in this wager!</p>
                <p>Visit our website to learn more about <strong>${title}:</strong> <a href="http://www.flashscore.com.ng">Click Here</a></p>
                <p>Best regards,</p>
                <p><strong>${userUserName}</strong></p>
            `;
    let emailsSentCount = 0;
    let emailsFailedCount = 0;
    const failedEmailDetails = [];
    const processedUsernames = new Set();
    const emailPromises = invitesFoundInDb.map(async (user) => {
      processedUsernames.add(user.userName.toLowerCase());
      if (!user.email) {
        console.warn(`User ${user.userName} has no email address. Skipping.`);
        failedEmailDetails.push({
          username: user.userName,
          reason: `No email address found for user in DB.`,
        });
        return;
      }
      try {
        const userName = user.name || user.userName;
        const htmlContent = emailHtmlTemplate(userName);
        const textContent = emailPlainText(userName);
        await sendEmail(user.email, emailSubject, textContent, htmlContent);
        emailsSentCount++;
      } catch (emailError) {
        console.error(
          `Failed to send email to ${user.email} (SMTP error):`,
          emailError.message
        );
        emailsFailedCount++;
        failedEmailDetails.push({
          username: user.userName,
          email: user.email,
          reason: `SMTP error: ${emailError.message}`,
        });
      }
    });
    await Promise.allSettled(emailPromises);
    invites.forEach((invitedUsername) => {
      if (!processedUsernames.has(invitedUsername.toLowerCase())) {
        emailsFailedCount++;
        failedEmailDetails.push({
          username: invitedUsername,
          reason: 'User not registered in database (no matching email found).',
        });
      }
    });
    return res.status(200).json({
      wager,
      successfulTx,
      wagererBalance: wagererWallet.balance,
      companyBalance: companyWallet.balance,
      failedTx,
    message: `Email sending process completed.`,
      totalUsers: invites.length + userFoundInDb.length,
      usersFoundInDb: userFoundInDb.length + invitesFoundInDb.length,
      usersNotfoundInDb: emailsFailedCount,
      emailsSent: emailsSentCount + sentEmailCount,
      emailsFailed: emailsFailedCount,
      invitesFoundInDb: invitesFoundInDb.length,
      failedEmailDetails: failedEmailDetails,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All wager
export const getAllWagers = async (req, res) => {
  try {
    const wagers = await Wager.find({});
    res.status(200).json(wagers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// get wager
export const getWagerTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const wagerTransaction = await WagerTransaction.findById(id);
    res.status(200).json(wagerTransaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Get A Wager
export const getWager = async (req, res) => {
  try {
    const { wagerId } = req.params;
    const wager = await Wager.findById(wagerId);
    if (!wager) {
      return res.status(400).json({ message: "No wager founded " });
    }
    res.status(200).json(wager);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get A wager by user
export const getWagerByUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const wager = await Wager.find({ wagerId: userId });
    if (!wager) {
      return res.status(404).json({ message: "Wager not found" });
    }
    res.status(200).json(wager);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// get all wager transactions
export const getAllWagerTransactions = async (req, res) => {
  try {
    const wagerTransactions = await WagerTransaction.find();

    if (!wagerTransactions || wagerTransactions.length === 0) {
      return res.status(404).json({ message: "No wager transactions found." });
    }

    return res.status(200).json(wagerTransactions);
  } catch (error) {
    console.error("Error fetching all wager transactions:", error);
    res.status(500).json({
      message: "Failed to fetch wager transactions",
      error: error.message,
    });
  }
};

// Accept wager
export const acceptWager = async (req, res) => {
  try {
    const wagerTransactionId = req.params.wagerTransactionId;
    const takerUserName = req.user.userName;
    const userId = req.user.id;
    const companyId = req.params.companyId;
    const takerId = req.params.userId;
    const endDate = req.endDate;
    const stake = req.stake;

    const wagerTransaction = await WagerTransaction.findById(
      wagerTransactionId
    );
    if (!wagerTransaction) {
      return res.status(404).json({ message: "Wager invite not found" });
    }

    if (wagerTransaction.status === "pending" && new Date() > new Date(wagerTransaction.endDate)) {
         // Credit the wagerer's wallet
      const wagererWallet = await UserWallet.findOne({
        userId: wagerTransaction.wagererId, // Use wagererId from wagerTransaction
      });
      if (!wagererWallet) {
        return res.status(404).json({ message: "Wagerer wallet not found" });
      }

      let oldWagererBalance = Number(wagererWallet.balance);
      let currentWagererBalance = Number(wagererWallet.balance);
      if (isNaN(currentWagererBalance)) {
        console.error(
          "ERROR: Wagerer wallet balance is not a number:",
          wagererWallet.balance
        );
        return res
          .status(500)
          .json({ message: "ERROR: Wagerer wallet has invalid balance" });
      }
      wagererWallet.balance = currentWagererBalance + wagerTransaction.stake;
      await wagererWallet.save();
      await Ledger.create({
        userId: userId,
        oldBalance: oldWagererBalance,
        newBalance: wagererWallet.balance,
        balance: wagererWallet.balance,
      });

      // Debit the company wallet
      const companyWallet = await CompanyWallet.findOne({ companyId });
      if (!companyWallet) {
        return res.status(404).json({ message: "Company wallet not found" });
      }

      let oldCompanyBalance = Number(companyWallet.balance);
      let currentCompanyBalance = Number(companyWallet.balance);
      if (isNaN(currentCompanyBalance)) {
        console.error(
          "ERROR: Company wallet balance is not a number:",
          companyWallet.balance
        );
        return res
          .status(500)
          .json({ message: "ERROR: Company wallet has invalid balance" });
      }
      companyWallet.balance = currentCompanyBalance - wagerTransaction.stake;
      await companyWallet.save();
      await LedgerWallet.create({
        companyId: companyWallet._id,
        oldBalance: oldCompanyBalance,
        newBalance: companyWallet.balance,
        balance: companyWallet.balance,
      });
      return res.status(403).json({ message: "This wager has expired" });
    }

    const takerWallet = await UserWallet.findOne({
      userId: wagerTransaction.takerId,
    });
    if (!takerWallet) {
      return res.status(404).json({ message: "Taker wallet not found" });
    }

    if (takerWallet.balance < wagerTransaction.stake) {
      return res
        .status(400)
        .json({ message: "Insufficient balance for wager" });
    }

    if (wagerTransaction.wagerer === takerUserName) {
      return res
        .status(403)
        .json({ message: "You cannot accept your own wager invite." });
    }

    if (wagerTransaction.status === "accepted") {
      return res
        .status(400)
        .json({ message: "This wager invite has already been accepted." });
    }

    if (wagerTransaction.status === "declined") {
      return res
        .status(400)
        .json({ message: "This wager invite has already been declined." });
    }

    if (wagerTransaction.taker === takerUserName) {
      wagerTransaction.status = "accepted";
      await wagerTransaction.save();

      const wager = await Wager.findById(wagerTransaction.wagerId);
      if (wager) {
        wager.acceptedBy = [...(wager.acceptedBy || []), takerUserName];
        await wager.save();
      }

      // Deduct from the taker's wallet:

      let oldTakerBalance = Number(takerWallet.balance);
      takerWallet.balance -= wagerTransaction.stake;
      await takerWallet.save();

      const ledger = await Ledger.create({
        userId: wagerTransaction.takerId,
        oldBalance: oldTakerBalance,
        newBalance: takerWallet.balance, // Use the updated balance
      });
      await ledger.save();

      // 5. Find the company wallet.
      const companyWallet = await CompanyWallet.findOne({ companyId });
      if (!companyWallet) {
        return res.status(404).json({ message: "Company wallet not found" });
      }

      let oldCompanyBalance = Number(companyWallet.balance);
      let currentCompanyBalance = Number(companyWallet.balance);
      if (isNaN(currentCompanyBalance)) {
        console.error(
          " ERROR: Company wallet balance is not a number:",
          companyWallet.balance
        );
        return res
          .status(500)
          .json({ message: "ERROR: Company wallet has invalid balance" });
      }
      companyWallet.balance = currentCompanyBalance + wagerTransaction.stake;
      await companyWallet.save();
      await LedgerWallet.create({
        companyId: companyWallet._id,
        oldBalance: oldCompanyBalance,
        newBalance: companyWallet.balance,
        balance: companyWallet.balance,
      });
      return res
        .status(200)
        .json({ message: "Wager invite accepted successfully" });
    } else {
      return res
        .status(403)
        .json({ message: "This wager invite is not intended for you." });
    }
  } catch (error) {
    console.error("Error accepting wager:", error);
    res
      .status(500)
      .json({ message: "Failed to accept wager invite", error: error.message });
  }
};

export const respondToWager = async (req, res) => {
  try {
    const wagerTransactionId = req.params.wagerTransactionId;
    const takerUserName = req.user.userName;
    const takerId = req.params.userId;
    const response = req.body.response;
    const stake = req.stake;
    const wagererId = req.params.userId;
    const userId = req.user.id;
    const companyId = req.params.companyId;
    const endDate = req.endDate;

    const wagerTransaction = await WagerTransaction.findById(
      wagerTransactionId
    );
    if (!wagerTransaction) {
      return res.status(404).json({ message: "Wager invite not found" });
    }

    if (new Date() > new Date(wagerTransaction.endDate)) {
      return res.status(403).json({ message: "This wager has expired" });
    }

    const takerWallet = await UserWallet.findOne({
      userId: wagerTransaction.takerId,
    }); // Find by takerId
    if (!takerWallet) {
      return res.status(404).json({ message: "Taker wallet not found" });
    }

    if (takerWallet.balance < wagerTransaction.stake) {
      return res
        .status(400)
        .json({ message: "Insufficient balance for wager" });
    }

    if (wagerTransaction.wagerer === takerUserName) {
      return res
        .status(403)
        .json({ message: "You cannot accept your own wager invite." });
    }

    if (wagerTransaction.status === "accepted") {
      return res
        .status(400)
        .json({ message: "This wager invite has already been accepted." });
    }

    if (wagerTransaction.status === "declined") {
      return res
        .status(400)
        .json({ message: "This wager invite has already been declined." });
    }

    if (response === "accepted") {
      wagerTransaction.status = "accepted";
      await wagerTransaction.save();

      const wager = await Wager.findById(wagerTransaction.wagerId);
      if (wager) {
        wager.acceptedBy = [...(wager.acceptedBy || []), takerUserName]; // Use takerUserName
        await wager.save();
      }

      let oldTakerBalance = Number(takerWallet.balance);
      takerWallet.balance -= wagerTransaction.stake;
      await takerWallet.save();

      const ledger = await Ledger.create({
        userId: wagerTransaction.takerId,
        oldBalance: oldTakerBalance,
        newBalance: takerWallet.balance, // Use the updated balance
      });
      await ledger.save();

      const companyWallet = await CompanyWallet.findOne({ companyId });
      if (!companyWallet) {
        return res.status(404).json({ message: "Company wallet not found" });
      }

      let oldCompanyBalance = Number(companyWallet.balance);
      let currentCompanyBalance = Number(companyWallet.balance);
      if (isNaN(currentCompanyBalance)) {
        console.error(
          " ERROR: Company wallet balance is not a number:",
          companyWallet.balance
        );
        return res
          .status(500)
          .json({ message: "ERROR: Company wallet has invalid balance" });
      }
      companyWallet.balance = currentCompanyBalance + wagerTransaction.stake;
      await companyWallet.save();
      await LedgerWallet.create({
        companyId: companyWallet._id,
        oldBalance: oldCompanyBalance,
        newBalance: companyWallet.balance,
        balance: companyWallet.balance,
      });

      return res.status(200).json({
        message: "Wager invite accepted successfully",
        userBalance: takerWallet.balance,
      }); // Return taker's balance
    } else if (response === "declined") {
      wagerTransaction.status = "declined";
      await wagerTransaction.save();

      const wager = await Wager.findById(wagerTransaction.wagerId);
      if (wager) {
        wager.rejectedBy = [...(wager.rejectedBy || []), takerUserName];
        await wager.save();
      }

      // Credit the wagerer's wallet
      const wagererWallet = await UserWallet.findOne({
        userId: wagerTransaction.wagererId, // Use wagererId from wagerTransaction
      });
      if (!wagererWallet) {
        return res.status(404).json({ message: "Wagerer wallet not found" });
      }

      let oldWagererBalance = Number(wagererWallet.balance);
      let currentWagererBalance = Number(wagererWallet.balance);
      if (isNaN(currentWagererBalance)) {
        console.error(
          "ERROR: Wagerer wallet balance is not a number:",
          wagererWallet.balance
        );
        return res
          .status(500)
          .json({ message: "ERROR: Wagerer wallet has invalid balance" });
      }
      wagererWallet.balance = currentWagererBalance + wagerTransaction.stake;
      await wagererWallet.save();
      await Ledger.create({
        userId: userId,
        oldBalance: oldWagererBalance,
        newBalance: wagererWallet.balance,
        balance: wagererWallet.balance,
      });

      // Debit the company wallet
      const companyWallet = await CompanyWallet.findOne({ companyId });
      if (!companyWallet) {
        return res.status(404).json({ message: "Company wallet not found" });
      }

      let oldCompanyBalance = Number(companyWallet.balance);
      let currentCompanyBalance = Number(companyWallet.balance);
      if (isNaN(currentCompanyBalance)) {
        console.error(
          "ERROR: Company wallet balance is not a number:",
          companyWallet.balance
        );
        return res
          .status(500)
          .json({ message: "ERROR: Company wallet has invalid balance" });
      }
      companyWallet.balance = currentCompanyBalance - wagerTransaction.stake;
      await companyWallet.save();
      await LedgerWallet.create({
        companyId: companyWallet._id,
        oldBalance: oldCompanyBalance,
        newBalance: companyWallet.balance,
        balance: companyWallet.balance,
      });

      return res.status(200).json({
        message: "Wager invite declined successfully",
        userBalance: wagererWallet.balance, // Return wagerer's balance
      });
     } else {
        return res
          .status(404)
          .json({ info: `Access Denied`, message: `Invalid action` });
      }
  

      // function sendMail() {
    //   let mailTransporter = nodemailer.createTransport({
    //     service: `gmail`,
    //     auth: {
    //       user: `${process.env.EMAILFROM}`,
    //       pass: `${process.env.EMAILPASSWORD}`,
    //     },
    //   });
    //   let mailDetails = {
    //     from: `${process.env.EMAILFROM}`,
    //     to: `${process.env.EMAILTO}`,
    //     subject: `Wager Reminder`,
    //     text: `Check your wagers`,
    //   };
    //   mailTransporter.sendMail(mailDetails, function (err, data) {
    //     if (err) {
    //       console.log(`Error Occurs`, err);
    //     } else {
    //       console.log(`Email sent successfully`);
    //     }
    //   });
    // }
    const invitesFoundInDb = await User.find({
      userName: { $in: invites.map((u) => u.toLowerCase()) },
    }).select(`email name username`);
    if (invitesFoundInDb.length === 0) {
      return res.status(404).json({ message: `No user found.` });
    }
    const emailSubject = `${title}`;
    const emailPlainText = (user) =>
      `Hi ${user},\n\nCheck out this wager\n\nBest regards,\n<strong>${userUserName}</strong>`;
    const emailHtmlTemplate = (user) => `
                <p>Hi <strong>${user}</strong>,</p>
                <p><strong>${userUserName}</strong> has created a wager <strong>${title}</strong> and you have been invited to participate in this wager!</p>
                <p>Visit our website to learn more about <strong>${title}:</strong> <a href="http://www.flashscore.com.ng">Click Here</a></p>
                <p>Best regards,</p>
                <p><strong>${userUserName}</strong></p>
            `;
    let emailsSentCount = 0;
    let emailsFailedCount = 0;
    const failedEmailDetails = [];
    const processedUsernames = new Set();
    const emailPromises = invitesFoundInDb.map(async (user) => {
      processedUsernames.add(user.userName.toLowerCase());
      if (!user.email) {
        console.warn(`User ${user.userName} has no email address. Skipping.`);
        failedEmailDetails.push({
          username: user.userName,
          reason: `No email address found for user in DB.`,
        });
        return;
      }
      try {
        const userName = user.name || user.userName;
        const htmlContent = emailHtmlTemplate(userName);
        const textContent = emailPlainText(userName);
        await senderEmail(user.email, emailSubject, textContent, htmlContent);
        emailsSentCount++;
      } catch (emailError) {
        console.error(
          `Failed to send email to ${user.email} (SMTP error):`,
          emailError.message
        );
        emailsFailedCount++;
        failedEmailDetails.push({
          username: user.userName,
          email: user.email,
          reason: `SMTP error: ${emailError.message}`,
        });
      }
    });
    await Promise.allSettled(emailPromises);
    invites.forEach((invitedUsername) => {
      if (!processedUsernames.has(invitedUsername.toLowerCase())) {
        emailsFailedCount++;
        failedEmailDetails.push({
          username: invitedUsername,
          reason: 'User not registered in database (no matching email found).',
        });
      }
    });
    return res.status(200).json({
      wager,
      successfulTx,
      wagererBalance: wagererWallet.balance,
      companyBalance: companyWallet.balance,
      failedTx,
    message: `Email sending process completed.`,
      totalUsers: invites.length + userFoundInDb.length,
      usersFoundInDb: userFoundInDb.length + invitesFoundInDb.length,
      usersNotfoundInDb: emailsFailedCount,
      emailsSent: emailsSentCount + sentEmailCount,
      emailsFailed: emailsFailedCount,
      invitesFoundInDb: invitesFoundInDb.length,
      failedEmailDetails: failedEmailDetails,
    });
  } catch (error) {
    console.error("Error responding to wager:", error);
    res.status(500).json({
      message: "Failed to respond to wager invite",
      error: error.message,
    });
  }
};

// decline wager
export const declineWager = async (req, res) => {
  try {
    const wagerTransactionId = req.params.wagerTransactionId;
    const takerUserName = req.user.userName;
    const wagererId = req.params.userId;
    const userId = req.user.id;
    const companyId = req.params.companyId;
    const endDate = req.endDate;
    const stake = req.stake;

    const wagerTransaction = await WagerTransaction.findById(
      wagerTransactionId
    );
    console.log(wagerTransactionId);
    if (!wagerTransaction) {
      return res.status(404).json({ message: "Wager invite not found" });
    }

   
    if (wagerTransaction.status === "pending" && new Date() > new Date(wagerTransaction.endDate)) {
        wagerTransaction.status === "expired"
       await wagerTransaction.save()
    
         // Credit the wagerer's wallet
      const wagererWallet = await UserWallet.findOne({
        userId: wagerTransaction.wagererId, // Use wagererId from wagerTransaction
      });
      if (!wagererWallet) {
        return res.status(404).json({ message: "Wagerer wallet not found" });
      }

      let oldWagererBalance = Number(wagererWallet.balance);
      let currentWagererBalance = Number(wagererWallet.balance);
      if (isNaN(currentWagererBalance)) {
        console.error(
          "ERROR: Wagerer wallet balance is not a number:",
          wagererWallet.balance
        );
        return res
          .status(500)
          .json({ message: "ERROR: Wagerer wallet has invalid balance" });
      }
      wagererWallet.balance = currentWagererBalance + wagerTransaction.stake;
      await wagererWallet.save();
      await Ledger.create({
        userId: userId,
        oldBalance: oldWagererBalance,
        newBalance: wagererWallet.balance,
        balance: wagererWallet.balance,
      });

      // Debit the company wallet
      const companyWallet = await CompanyWallet.findOne({ companyId });
      if (!companyWallet) {
        return res.status(404).json({ message: "Company wallet not found" });
      }

      let oldCompanyBalance = Number(companyWallet.balance);
      let currentCompanyBalance = Number(companyWallet.balance);
      if (isNaN(currentCompanyBalance)) {
        console.error(
          "ERROR: Company wallet balance is not a number:",
          companyWallet.balance
        );
        return res
          .status(500)
          .json({ message: "ERROR: Company wallet has invalid balance" });
      }
      companyWallet.balance = currentCompanyBalance - wagerTransaction.stake;
      await companyWallet.save();
      await LedgerWallet.create({
        companyId: companyWallet._id,
        oldBalance: oldCompanyBalance,
        newBalance: companyWallet.balance,
        balance: companyWallet.balance,
      });
      return   res.status(403).json({ message: "This wager has expired" });wagerTransaction.status === "expired"
     
    }

    if (wagerTransaction.wagerer === takerUserName) {
      return res
        .status(403)
        .json({ message: "You cannot accept your own wager invite." });
    }

    if (wagerTransaction.status === "accepted") {
      return res
        .status(400)
        .json({ message: "This wager invite has already been accepted." });
    }

    if (wagerTransaction.status === "declined") {
      return res
        .status(400)
        .json({ message: "This wager invite has already been declined." });
    }

    if (wagerTransaction.taker === takerUserName) {
      wagerTransaction.status = "declined";
      await wagerTransaction.save();

      const wager = await Wager.findById(wagerTransaction.wagerId);
      if (wager) {
        wager.rejectedBy = [...(wager.rejectedBy || []), takerUserName];
        await wager.save();
        // Credit the wagerer's wallet
        const wagererWallet = await UserWallet.findOne({
          userId: wagerTransaction.wagererId, // Use wagererId from wagerTransaction
        });
        if (!wagererWallet) {
          return res.status(404).json({ message: "Wagerer wallet not found" });
        }

        let oldWagererBalance = Number(wagererWallet.balance);
        let currentWagererBalance = Number(wagererWallet.balance);
        if (isNaN(currentWagererBalance)) {
          console.error(
            "ERROR: Wagerer wallet balance is not a number:",
            wagererWallet.balance
          );
          return res
            .status(500)
            .json({ message: "ERROR: Wagerer wallet has invalid balance" });
        }
        wagererWallet.balance = currentWagererBalance + wagerTransaction.stake;
        await wagererWallet.save();
        await Ledger.create({
          userId: userId,
          oldBalance: oldWagererBalance,
          newBalance: wagererWallet.balance,
          balance: wagererWallet.balance,
        });

        // debit company wallet

        const companyWallet = await CompanyWallet.findOne({ companyId });
        if (!companyWallet) {
          return res.status(404).json({ message: "Company wallet not found" });
        }

        let oldCompanyBalance = Number(companyWallet.balance);
        let currentCompanyBalance = Number(companyWallet.balance);
        if (isNaN(currentCompanyBalance)) {
          console.error(
            " ERROR: Company wallet balance is not a number:",
            companyWallet.balance
          );
          return res
            .status(500)
            .json({ message: "ERROR: Company wallet has invalid balance" });
        }
        companyWallet.balance = currentCompanyBalance - wagerTransaction.stake;
        await companyWallet.save();
        await LedgerWallet.create({
          companyId: companyWallet._id,
          oldBalance: oldCompanyBalance,
          newBalance: companyWallet.balance,
          balance: companyWallet.balance,
        });

        return res.status(200).json({
          message: "Wager invite declined successfully",
          userBalance: wagererWallet.balance,
        });
      } else {
        return res.status(400).json({ message: "Invalid response" });
      }
    }
  } catch (error) {
    console.error("Error declining wager:", error);
    res.status(500).json({
      message: "Failed to decline wager invite",
      error: error.message,
    });
  }
};

//  grade wager

export const gradeWager = async (req, res) => {
  try {
    const { wagerTransactionId } = req.params;
    const { outcome } = req.body; // Expected values: 'win', 'loss', 'draw'
    const companyId = req.params.companyId;
    const stake = req.stake;
    const wagererId = req.params.userId;
    const userId = req.user.id;
    const takerId = req.params.userId;
    const taker = req.userUserName;
    const wagerer = req.userUserName;
    const grader = req.user;

    if (!grader || grader.role !== "admin") {
      return res
        .status(403)
        .json({ message: "You are not authorized to grade wagers." });
    }

    const wagerTransaction = await WagerTransaction.findById(
      wagerTransactionId
    );

    if (!wagerTransaction) {
      return res.status(404).json({ message: "Wager transaction not found" });
    }

    if (wagerTransaction.status !== "accepted") {
      return res
        .status(400)
        .json({ message: "Wager invite must be accepted before grading." });
    }

    if (new Date() < new Date(wagerTransaction.endDate)) {
      return res.status(403).json({
        message: "This wager cannot be graded yet.",
        availableAfter: wagerTransaction.endDate,
      });
    }

    if (!["win", "lost", "draw"].includes(outcome)) {
      return res.status(400).json({
        message: "Invalid wager outcome. Expected 'win', 'lost', or 'draw'.",
      });
    }

    const companyWallet = await CompanyWallet.findOne({ companyId });
    if (!companyWallet) {
      return res.status(404).json({ message: "Company wallet not found" });
    }

    // Declare wagerer and taker stake
    const wagererStake = wagerTransaction.stake;
    const takerStake = wagerTransaction.stake;

    const commissionRate = 0.1;
    const commissionAmount = wagerTransaction.stake * 2 * commissionRate;
    const winningPayout = wagerTransaction.stake * 2 - commissionAmount;
    const individualRefund = wagerTransaction.stake * (1 - commissionRate);

    if (outcome === "win") {
      wagerTransaction.outcome === "win";

      // Credit the wagerer's wallet
      const wagererWallet = await UserWallet.findOne({
        userId: wagerTransaction.wagererId,
      });
      if (!wagererWallet) {
        return res.status(404).json({ message: "Wagerer wallet not found" });
      }

      let oldWagererBalance = Number(wagererWallet.balance);
      let currentWagererBalance = Number(wagererWallet.balance);
      if (isNaN(currentWagererBalance)) {
        console.error(
          "ERROR: Wagerer wallet balance is not a number:",
          wagererWallet.balance
        );
        return res
          .status(500)
          .json({ message: "ERROR: Wagerer wallet has invalid balance" });
      }
      wagererWallet.balance = currentWagererBalance + winningPayout;
      await wagererWallet.save();
      await Ledger.create({
        userId: userId,
        oldBalance: oldWagererBalance,
        newBalance: wagererWallet.balance,
        balance: wagererWallet.balance,
      });

      let oldCompanyBalance = Number(companyWallet.balance);
      let currentCompanyBalance = Number(companyWallet.balance);
      if (isNaN(currentCompanyBalance)) {
        console.error(
          " ERROR: Company wallet balance is not a number:",
          companyWallet.balance
        );
        return res
          .status(500)
          .json({ message: "ERROR: Company wallet has invalid balance" });
      }
      companyWallet.balance =
        currentCompanyBalance - winningPayout + commissionAmount;
      await companyWallet.save();
      await LedgerWallet.create({
        companyId: companyWallet._id,
        oldBalance: oldCompanyBalance,
        newBalance: companyWallet.balance,
        balance: companyWallet.balance,
      });
    }

    if (outcome === "lost") {
      wagerTransaction.outcome === "lost";

      const takerWallet = await UserWallet.findOne({
        userId: wagerTransaction.takerId,
      }); // Find by takerId
      if (!takerWallet) {
        return res.status(404).json({ message: "Taker wallet not found" });
      }

      let oldTakerBalance = Number(takerWallet.balance);
      takerWallet.balance += winningPayout;
      takerWallet.save();
      const ledger = await Ledger.create({
        userId: wagerTransaction.takerId,
        oldBalance: oldTakerBalance,
        newBalance: takerWallet.balance,
      });
      await ledger.save();

      let oldCompanyBalance = Number(companyWallet.balance);
      let currentCompanyBalance = Number(companyWallet.balance);
      if (isNaN(currentCompanyBalance)) {
        console.error(
          " ERROR: Company wallet balance is not a number:",
          companyWallet.balance
        );
        return res
          .status(500)
          .json({ message: "ERROR: Company wallet has invalid balance" });
      }
      companyWallet.balance =
        currentCompanyBalance - winningPayout + commissionAmount;
      await companyWallet.save();
      await LedgerWallet.create({
        companyId: companyWallet._id,
        oldBalance: oldCompanyBalance,
        newBalance: companyWallet.balance,
        balance: companyWallet.balance,
      });
    } else if (outcome === "draw") {
      wagerTransaction.outcome === "draw";

      const takerWallet = await UserWallet.findOne({
        userId: wagerTransaction.takerId,
      }); // Find by takerId
      if (!takerWallet) {
        return res.status(404).json({ message: "Taker wallet not found" });
      }

      let oldTakerBalance = Number(takerWallet.balance);
      takerWallet.balance += individualRefund;
      takerWallet.save();
      const ledger = await Ledger.create({
        userId: wagerTransaction.takerId,
        oldBalance: oldTakerBalance,
        newBalance: takerWallet.balance, // Use the updated balance
      });
      await ledger.save();

      const wagererWallet = await UserWallet.findOne({
        userId: wagerTransaction.wagererId,
      });
      if (!wagererWallet) {
        return res.status(404).json({ message: "User wallet not found" });
      }

      let oldWagererBalance = Number(wagererWallet.balance);
      let currentWagererBalance = Number(wagererWallet.balance);
      if (isNaN(currentWagererBalance)) {
        console.error(
          " ERROR: Company wallet balance is not a number:",
          wagererWallet.balance
        );
        return res
          .status(500)
          .json({ message: "ERROR: Company wallet has invalid balance" });
      }
      wagererWallet.balance = currentWagererBalance + individualRefund;
      await wagererWallet.save();
      await Ledger.create({
        userId: userId,
        oldBalance: oldWagererBalance,
        newBalance: wagererWallet.balance,
        balance: wagererWallet.balance,
      });

      // const oldBalance = companyWallet.balance;
      let oldCompanyBalance = Number(companyWallet.balance);

      let currentCompanyBalance = Number(companyWallet.balance);
      if (isNaN(currentCompanyBalance)) {
        console.error(
          " ERROR: Company wallet balance is not a number:",
          companyWallet.balance
        );
        return res
          .status(500)
          .json({ message: "ERROR: Company wallet has invalid balance" });
      }
      companyWallet.balance =
        currentCompanyBalance - winningPayout + commissionAmount;
      await companyWallet.save();
      await LedgerWallet.create({
        companyId: companyWallet._id,
        oldBalance: oldCompanyBalance,
        newBalance: companyWallet.balance,
        balance: companyWallet.balance,
      });
       return res.status(200).json({
      message: "Wager Transaction graded successfully",
      wagerTransaction,
    });
    }
 // cron.schedule(`* * * * *`, function () {
    //   sendMail();
    // });
    function sendMail() {
      let mailTransporter = nodemailer.createTransport({
        service: `gmail`,
        auth: {
          user: `${process.env.EMAILFROM}`,
          pass: `${process.env.EMAILPASSWORD}`,
        },
      });
      let mailDetails = {
        from: `${process.env.EMAILFROM}`,
        to: `${process.env.EMAILTO}`,
        subject: `Wager Reminder`,
        text: `Check your wagers`,
      };
      mailTransporter.sendMail(mailDetails, function (err, data) {
        if (err) {
          console.log(`Error Occurs`, err);
        } else {
          console.log(`Email sent successfully`);
        }
      });
    }
    
  } 
  catch (error) {
    console.error("Error grading wager:", error);
    res.status(500).json({
      message: "Failed to grade wager transaction",
      error: error.message,
    });
  }
};



// update a wager
export const updateWager = async (req, res) => {
  try {
    const wagerId = req.params.wagerId;
    const wagererId = req.params.userId;
    const userId = req.user.id;
    const { stake, invites} = req.body;
    const endDate = req.endDate;

    const wager = await Wager.findById(wagerId);
    console.log(wager);
    if (!wager) {
      return res.status(404).json({ message: "Wager not found" });
    }

    if (userId !== wager.wagererId) {
      return res
        .status(403)
        .json({ message: "You are not authorized to edit this wager" });
    }

    if (new Date() > new Date(wager.endDate)) {
      return res.status(400).json({ message: "This wager cannot be edited" });
    }
    if (wager.status === "pending") {
       wager.invites === invites;
       wager.stake === stake;
      
        return  res .status(200) .json({ message: `stake updated by ${stake}`});
      } 
     await wager.save()  
      // else {
      //     res.status(400).json({message:"error occur"})
      // }
     
    
  } catch (error) {
    console.error("Error editing wager:", error);
    res
      .status(500)
      .json({ message: "Failed to edit wager", error: error.message });
  }
};
