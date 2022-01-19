const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user:{type:mongoose.Types.ObjectId},
    paymentMethod:{type:String},
    status:{type:String},
    totalAmount:{type:Number},
    delivaryDetails:{
        type:Object,
        name:{type:String},
        phone:{type:Number},
        address:{type:String},
        pincode:{type:Number}        
    },
    products:{type:Array},
    date:{type:Date}
})

const ORDER = new mongoose.model("Order",orderSchema)



module.exports = ORDER;