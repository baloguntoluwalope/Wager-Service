
import { UserWallet } from "../Models/Wallet.js";
import { CompanyWallet } from "../Models/CompanyWallet.js";
import { Company } from "../Models/Company.js";
import { Ledger } from "../Models/Ledger.js";



// export const createWallet = async (req,res)=>{
//   const { name, initialBalance = 10000} = req.body;
//   try {
//     let userWallet = await UserWallet.findOne({ name });
//     if (userWallet) {
//       return res
//         .status(409)
//         .json({ message: 'Wallet exist' });
//     }

//     userWallet = await UserWallet.create({ userId:user._id,
//       balance:initialBalance
//     });    
//   } catch (error) {
    
//   }
// }

// get balance
export const getBalance = async (req,res)=>{
  
    const userId = req.params.userId;
  try {
    const userWallet = await UserWallet.findOne({ userId });
    if (!userWallet) {
      return res.status(404).json({ message: 'User wallet not found' });
    }
    return res.json({ balance: userWallet.balance, userId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
    
}


export const creditWallet = async(req,res) => {
 try {
  const {amount} = req.body;
  const userId = req.user.id;
  if(userId){
    if(!amount){
      return res.status(404).json({message:"crediting failed"});
    }

    
    const userWallet = await UserWallet.findOne({userId});
    console.log(userWallet);
       let oldUserBalance = Number(userWallet.balance);
       console.log(typeof userWallet.balance);
    userWallet.balance += amount;
    await userWallet.save();
       await Ledger.create({
      userId: userId,
      oldBalance: oldUserBalance,
      newBalance: userWallet.balance,
      balance: userWallet.balance,
    
    });

    return res.status(200).json({
      message: `Wallet credited with ${amount}`,
      newBalance: userWallet.balance,
  })}
 } catch (error) {
   res.status(500).json({message:error.message})
 }
}




export const getUserWalletTransactions = async (req,res)=>{
  try {
    const userId = req.params.userId;
    const userWallet = await UserWallet.findOne({ userId });
    if (!userWallet) {
      return res.status(404).json({ message: 'User wallet not found' });
    }
    res.json({ transactions: userWallet.transactions });
  } catch (error) {
    
  }
}



export const getAllUserWallet = async (req, res) => {
    try {
      const userWallet = await UserWallet.find();
  
      if (!userWallet || userWallet.length === 0) {
        return res.status(404).json({ message: "No user wallet found" });
      }
  
      return res.status(200).json(userWallet);
    } catch (error) {
      console.error("Error fetching all user wallet:", error);
      res.status(500).json({ message: "Failed to fetch wallets", error: error.message });
    }
  };


  export const getLedgerBalance = async (req, res) => {
    try {
      const { userId } = req.params; 
  
      
      const ledgerEntries = await Ledger.find({ userId }).sort({ createdAt: 1 });
  
      if (!ledgerEntries || ledgerEntries.length === 0) {
        return res.status(404).json({ message: "Ledger entries not found for this user" });
      }
  
      
      const currentBalance = ledgerEntries[ledgerEntries.length - 1].newBalance;
  
      res.status(200).json({
        message: "Ledger balance retrieved successfully",
        userId,
        currentBalance,
        ledgerEntries, 
      });
    } catch (error) {
      console.error("Error getting ledger balance:", error);
      res.status(500).json({ message: "Failed to retrieve ledger balance", error: error.message });
    }
  };


