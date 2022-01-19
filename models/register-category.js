const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    categoryName:{type:String,unique:true},
    subCategory:{type:Array},
    isActive:{type:Boolean,default:true},
    hasDiscount:{type:Boolean,default:false}
})

const CATEGORY = new mongoose.model("Category",categorySchema)



module.exports = CATEGORY;