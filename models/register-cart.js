const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    user:{type:mongoose.Types.ObjectId},
    products:{
        type:Array
        
    }
})

const CART = new mongoose.model("Cart",cartSchema)



module.exports = CART;