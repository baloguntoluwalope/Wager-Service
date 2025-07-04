import mongoose from "mongoose";


const wagerTransactionSchema = new mongoose.Schema({
    wagerId:{type: mongoose.Schema.Types.ObjectId},
    stake:{type:Number,require:true},
    title:{type:String,require:true},
    description:{type:String,require:true},
    wagererPosition:{type:Boolean, require:true},
    takerPosition:{type:Boolean, require:true},
    wagerer:{type:String},
    wagererId:{type: mongoose.Schema.Types.ObjectId, ref: 'User',},
    takerId:{type: mongoose.Schema.Types.ObjectId, ref: 'User',},
    taker:{type:String},
    endDate:{type:Date,require:true},
    outcome:{type:String,enum:['win','draw','lost']},
    status:{type:String,
        enum: ['pending', 'accepted', 'declined','expired', 'graded'],default:'pending',},
},
{timestamps:true}
)

export const WagerTransaction = mongoose.model("WagerTransaction",wagerTransactionSchema)