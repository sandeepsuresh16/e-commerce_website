const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
    user:{type:mongoose.Types.ObjectId},
    products:{
        type:Array
        
    }
})

const WISHLIST = new mongoose.model("Wishlist",wishlistSchema)



module.exports = WISHLIST;