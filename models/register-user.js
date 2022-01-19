const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name:{type:String},
    email:{type:String,unique:true},
    phone:{type:Number,unique:true,required:true},
    password:{ type:String},
    referralCode:{type:Number},
    wallet:{type:Number,default:0},
    isActive:{type:Boolean,default:true},
    isUser:{type:Boolean,default:true},
    coupon:{type:Array,default:[]}
})

const Register = new mongoose.model("Users",userSchema);

module.exports = Register;