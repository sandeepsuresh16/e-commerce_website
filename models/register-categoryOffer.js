const mongoose = require('mongoose');

const categoryOfferSchema = new mongoose.Schema({
    offerName:{type:String,unique:true},
    offerPercent:{type:Number},
    category:{type:String},
    expDate: {type: Date}
})

const CATEGORY_OFFER = new mongoose.model("OfferCategory",categoryOfferSchema)



module.exports = CATEGORY_OFFER;