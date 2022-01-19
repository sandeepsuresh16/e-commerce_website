const Register = require('../models/register-user')
const PRODUCT = require('../models/register-product')
const CATEGORY = require('../models/register-category')
const CART =  require('../models/register-cart')
const ORDER = require('../models/register-order')
const ADDRESS = require('../models/register-address')
const OFFERCATEGORY = require('../models/register-categoryOffer')
const OFFERPRODUCT = require('../models/register-productOffer')
const COUPON = require('../models/register-coupon')
var ObjectId = require('mongoose').Types.ObjectId
const WISHLIST = require('../models/register-Wishlist')
const product_HELPER = require('../helpers/product-helper')
const order_HELPER = require('../helpers/order-helper')


module.exports = {

    addNewCategoryOffer:(details)=>{
       return new Promise(async(resolve,reject)=>{
        try {
            const newOffer = new OFFERCATEGORY({
                offerName:details['offer-name'].toUpperCase(),
                offerPercent:details['offer-percent'],
                category:details['offer-category'],
                expDate:details['offer-date']
            })
            const regOffer = await newOffer.save()
            await PRODUCT.updateMany({category:regOffer.category},{$set:{catDiscount:regOffer.offerPercent,catDiscountId:regOffer._id}})
            await CATEGORY.updateOne({categoryName:regOffer.category},{$set:{hasDiscount:true}})                     
            resolve({'status':'success'})
        } catch (error) {
            console.log(error)
            resolve({'status':'error'})
        }
       }) 
    },

    deleteCategoryOffer:(offerId,categoryName)=>{
        return new Promise(async(resolve,reject)=>{
            await OFFERCATEGORY.deleteOne({_id:ObjectId(offerId)})
            await PRODUCT.updateMany({catDiscountId:offerId},{$set:{catDiscount:0,catDiscountId:""}})
            await CATEGORY.updateOne({categoryName:categoryName},{$set:{hasDiscount:false}})
            resolve()
        })
    },

    addNewProductOffer:(details)=>{
        return new Promise(async(resolve,reject)=>{
            try {
                const newOffer = new OFFERPRODUCT({
                    offerName:details['offer-name'].toUpperCase(),
                    offerPercent:details['offer-percent'],
                    expDate:details['offer-date']                   
                })
                const refOffer = await newOffer.save()
                resolve({'status':'sucess'})
            } catch (error) {
                console.log(error)
                resolve({'status':'error'})
            }


        })
    },

    addOfferToProduct:(offerId,offerPercent,proId)=>{
        return new Promise(async (resolve,reject)=>{
            await PRODUCT.updateOne({_id:ObjectId(proId)},{$set:{discount:offerPercent,discountId:offerId}})
            resolve()
        })
    },

    deleteProductOffer:(offerId)=>{
        return new Promise(async (resolve, reject)=>{
            await OFFERPRODUCT.deleteOne({_id:ObjectId(offerId)})
            await PRODUCT.updateMany({discountId:offerId},{$set:{discount:0,discountId:""}})
            resolve()
        })
    },

    addNewCoupon:(details)=>{
        return new Promise(async(resolve, reject)=>{
            try {
                const newCoupon = new COUPON({
                    couponName:details['coupon-name'].toUpperCase(),
                    couponCode:details['coupon-code'].toUpperCase(),
                    couponAmount:details['coupon-amount'],
                    couponQuantity:details['coupon-number'],
                    expire:details['coupon-date']
                })

                await newCoupon.save()
                resolve({'status':'success'})
                
            } catch (error) {
                console.log(error)
                resolve({'status':'error'})
            }
        })
    }, 

    deleteCoupon:(couponId)=>{
        return new Promise(async(resolve,reject)=>{
            await COUPON.deleteOne({_id:ObjectId(couponId)})
            resolve()
        })
    }, 

    applyCoupon:(details,userId)=>{
        
        const couponCode = details.code.split('=')[1].toUpperCase()
        const cartTotal = parseInt(details.total) 
        
        return new Promise(async(resolve, reject)=>{
            const coupon = await COUPON.aggregate([{$match:{couponCode:couponCode}}])
            const user = await Register.findOne({_id:ObjectId(userId)})
            console.log(coupon)
            if(coupon.length>0){
                console.log('pt-1')
                if((cartTotal-coupon[0].couponAmount)<1){
                    console.log('pt-1.1')
                    resolve({'status':'min-amount'})
                }else{
                    console.log('pt-1.2')
                    if(user.coupon.length>0){
                        console.log('pt-1.2.1')
                        let couponExist = user.coupon.findIndex(item=>item==couponCode)
                        console.log(ObjectId(coupon[0]._id))
                        console.log(couponExist)
                        if(couponExist != -1){
                            console.log('pt-1.2.1.1')
                            resolve({'status':'used'})
                        }else{
                            console.log('pt-1.2.1.2')
                            await COUPON.updateOne({_id:ObjectId(coupon[0]._id)},{$set:{couponQuantity:coupon[0].couponQuantity-1}})
                            await Register.updateOne({_id:ObjectId(userId)},{$push:{coupon:couponCode}})
                            let newTotal=cartTotal-coupon[0].couponAmount
                            let discount = coupon[0].couponAmount
                            resolve({newTotal,discount})
                        }
                    }else{
                        console.log('pt-1.2.2')
                        await COUPON.updateOne({_id:ObjectId(coupon[0]._id)},{$set:{couponQuantity:coupon[0].couponQuantity-1}})
                        await Register.updateOne({_id:ObjectId(userId)},{$push:{coupon:couponCode}})
                        let newTotal=cartTotal-coupon[0].couponAmount
                        let discount = coupon[0].couponAmount
                        resolve({newTotal,discount})
                    }
                }
            }else{
                console.log('pt-2')
                resolve({'status':'not-found'})
            }
        })
    },

    redeemWallet: (userId,total)=>{
        return new Promise(async(resolve,reject)=>{
            const user= await Register.aggregate([{$match:{_id:ObjectId(userId)}}])
            if(user[0].wallet==0){
                resolve({'status':"empty"})
            }else{
                if((total-user[0].wallet)>0){
                    let newTotal = total-user[0].wallet
                    await Register.updateOne({_id:ObjectId(userId)},{$set:{wallet:0}})
                    resolve({'status':"success",newTotal})
                }else{
                    resolve({'status':"min-value"})
                }
            }
        })
    }
   
    
}
