import mongoose from "mongoose";


const wagerSchema = new mongoose.Schema({
    stake:{type:Number,require:true},
    title:{type:String,require:true},
    description:{type:String,require:true},
    wagerPosition:{type:Boolean,require:true},
    wagerer:{type:String},
    wagererId:{type:String},
    invites:{type:Array,required:true},
    endDate:{type:Date,require:true},
    acceptedBy:{type:Array},
    rejectedBy:{type:Array},
    outcome:{type:String},
        status:{type:String,
        enum: ['pending', 'accepted', 'declined', 'graded'],default:'pending',},
},

{timestamps:true}
)

export const Wager = mongoose.model("Wager",wagerSchema)