const mongoose = require('mongoose')

const couponSchema = new mongoose.Schema({
    couponName:{type:String,unique:true,required:true},
    couponCode:{type:String,required:true,unique:true},
    couponAmount:{type:Number,required:true},
    couponQuantity:{type:Number,required:true},
    expire:{type:Date,required:true}
})

const COUPON = new mongoose.model('Coupon',couponSchema)
module.exports = COUPON
