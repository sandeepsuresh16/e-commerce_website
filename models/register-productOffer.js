const mongoose = require('mongoose');

const productOfferSchema = new mongoose.Schema({
    offerName:{type:String,unique:true},
    offerPercent:{type:Number},
    expDate: {type: Date}
})

const PRODUCT_OFFER = new mongoose.model("OfferProduct",productOfferSchema)



module.exports = PRODUCT_OFFER;