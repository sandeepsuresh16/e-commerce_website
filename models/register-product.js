const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productName:{type:String},
    brand:{type:String},
    category:{type:String,unique:true},
    subCategory:{type:String},
    price:{ type:Number},
    quantity:{type:Number},
    description:{type:String},
    isActive:{type:Boolean,default:true},
    inStock:{type:Boolean,default:true},
    discount:{type:Number,default:0},
    catDiscount:{type:Number,default:0},
    date: { type: Date, default: Date.now },
    catDiscountId:{type:String, default:""},
    discountId:{type:String,default:""}
})

const PRODUCT = new mongoose.model("Products",productSchema)



module.exports = PRODUCT;