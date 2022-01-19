const Register = require('../models/register-user')
const PRODUCT = require('../models/register-product')
const CATEGORY = require('../models/register-category')
const CART =  require('../models/register-cart')
const ORDER = require('../models/register-order')
const ADDRESS = require('../models/register-address')
const WISHLIST = require('../models/register-Wishlist')
const cart_HELPER = require('../helpers/cart-helper')
const order_HELPER = require('../helpers/order-helper')
var ObjectId = require('mongoose').Types.ObjectId

module.exports = {
    login:(data)=>{
        return new Promise(async(resolve,reject)=>{
            let response={}
            const user = await findOne(data.email)
            
        })
    }
}