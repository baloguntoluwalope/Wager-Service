import { User } from "../Models/User.js";
import {UserWallet} from "../Models/Wallet.js"
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"

export const register = async (req, res) => {
  const { name, email, userName,password, role  ,initialBalance = 10000} = req.body;
  try {
    let user = await User.findOne({ email });
    if (user)
      return res.json({
        message: "This Particular users exist",
        success: false,
      });
    const hashPass = await bcrypt.hash(password, 10);

    user = await User.create({ name, email,userName, password: hashPass,role,
    });

    let userWallet = await UserWallet.findOne({ email });
    if (userWallet) {
      return res
        .status(409)
        .json({ message: 'Wallet already exists for this user' });
    }

    userWallet = await UserWallet.create({ userId:user._id,
      balance:initialBalance
    });
   
    await userWallet.save()
    res.json({ message: "User registered successfully.....!",user, userWallet,success: true });
  } catch (error) {
    res.json({ message: error.message });
  }
};


export const login = async (req,res)=>{
    const {email,userName,password} = req.body;
    try {
        let user = await User.findOne({email});
        if(!user)return res.json({message:"User Not Found",success:false})
            const validPassword = await bcrypt.compare(password,user.password);
        if(!validPassword) return res.json({message:"Invalid Credential",success:false});
 
        const token = jwt.sign({userId:user._id,role: user.role },"!@#$%^&*()",{
            expiresIn:'365d'
        })

        res.json({message:`Welcome${user.userName}`,token, role: user.role, userName: user.userName, userId: user._id, success:true})
    } catch (error) {
        res.json({message:error.message})
    }
}

// get all user
export const getAllUser = async (req, res) => {
  try {
    const user = await User.find({});
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// get a user
export const getUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ message: "This user does not exist " });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};