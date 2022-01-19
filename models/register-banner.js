const mongoose = require('mongoose');

const titleSchema = new mongoose.Schema({
    title1:{type:String},
    title2:{type:String},
    title3:{type:String}
})

const TITLE = new mongoose.model("Title",titleSchema)



module.exports = TITLE;