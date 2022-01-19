const Register = require('../models/register-user')
const PRODUCT = require('../models/register-product')
const CATEGORY = require('../models/register-category')
const CART =  require('../models/register-cart')
const ORDER = require('../models/register-order')
const ADDRESS = require('../models/register-address')
var ObjectId = require('mongoose').Types.ObjectId
const WISHLIST = require('../models/register-Wishlist')
const product_HELPER = require('../helpers/product-helper')
const order_HELPER = require('../helpers/order-helper')


module.exports = {

    cartCount:(userId)=>{
        return new Promise(async(resolve, reject)=>{
            const cart = await CART.aggregate([{$match:{user:ObjectId(userId)}}])
            console.log(cart)
            resolve(cart[0].products.length)
            
        })
        
    },

    removeCartItems:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            await CART.updateOne({user:ObjectId(userId)},{$set:{products:[]}})
            resolve()
        })
    },

    wishlistCount:(userId)=>{
        return new Promise(async(resolve, reject)=>{
            const cart = await WISHLIST.aggregate([{$match:{user:ObjectId(userId)}}])
            console.log(cart)
            resolve(cart[0].products.length)
            
        })
        
    },
}