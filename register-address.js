const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    user:{type:mongoose.Types.ObjectId},
    date:{type:Date},
    details:{
        type:Object,
        name:{type:String},
        address:{type:String},
        phone:{type:String},
        pin:{type:String}        
    },
    
})

const ADDRESS = new mongoose.model("Address",addressSchema)



module.exports = ADDRESS;