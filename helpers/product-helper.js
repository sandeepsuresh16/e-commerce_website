
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

    addToCart :(proId,userId)=>{
        let proObj = {
            item:proId,
            quantity:1
        }
        return new Promise(async (resolve, reject)=>{
            let userCart = await CART.findOne({user:ObjectId(userId)})
            if(userCart){
                let proExist = userCart.products.findIndex(product=>product.item==proId)
                console.log(proExist)
                if(proExist !=-1){
                   await CART.updateOne({user:ObjectId(userId),"products.item":proId},
                                        {$inc:{'products.$.quantity':1}})
                    resolve()
                }else{
                   await CART.updateOne({user:ObjectId(userId)},
                                    {$push:{products:proObj}})
                                    resolve()
                }
            }else{
                let cartObj= new CART({
                    user:userId,
                    products:[proObj]
                })
                await cartObj.save()
                resolve()
            }
        })
    },
    
    getCartProducts: (userId)=>{
        return new Promise( async (resolve, reject)=>{

            const cartItems= await CART.aggregate([{$match:{user:ObjectId(userId)}},{$unwind:"$products"},
            {$project:{item:{"$toObjectId": "$products.item"},quantity:"$products.quantity"}},
            {$lookup:{from:'products',localField:'item',foreignField:'_id',as:'product'}},
            {$project:{item:1, quantity:1,product:{$arrayElemAt:['$product',0]}}},
            {$project:{item:1, quantity:1,product:1,subTotal:{$multiply:['$quantity','$product.price']}}}])
            if(cartItems.length>0){
                for(i=0;i<cartItems.length;i++){
                    if(cartItems[i].product.discount>0 || cartItems[i].product.catDiscount>0){
                        if(cartItems[i].product.discount>cartItems[i].product.catDiscount){
                            cartItems[i].subTotal=Math.round(cartItems[i].quantity*cartItems[i].product.price*0.01*(100-cartItems[i].product.discount))
                        }else{
                            cartItems[i].subTotal=Math.round(cartItems[i].quantity*cartItems[i].product.price*0.01*(100-cartItems[i].product.catDiscount))
                        }
                    }
                }
            }
            resolve(cartItems)
            
        })
    },

    changeProductQuantity: (cartId,proId,count,quantity)=>{
        count = parseInt(count)
        quantity = parseInt(quantity)
        console.log(cartId, proId, count,quantity)

        return new Promise((resolve, reject)=>{
            if(count==-1 && quantity==1){
                CART.updateOne({_id:ObjectId(cartId)},{
                    $pull:{products:{item:proId}}
                }).then((response)=>{
                    resolve({remove:true})
                })
            }else{
                CART.updateOne({_id:ObjectId(cartId),"products.item":proId},
                {
                    $inc:{'products.$.quantity':count}
                }).then((response)=>{
                    resolve({status:true})
                })
            }
        })

        // return new Promise(async (resolve, reject)=>{
        //     CART.updateOne({_id:ObjectId(cartId),"products.item":proId},{$inc:{'products.$.quantity':count}}).then(()=>{
        //         resolve()
        //     })
        // })
    },

    deleteCartProduct: ({cartId,proId})=>{
        return new Promise((resolve,reject)=>{
            CART.updateOne({_id:ObjectId(cartId)},{$pull:{products:{item:proId}}
            }).then((response)=>{
                resolve({remove:true})
            })
        })

    },

    // getCartTotal: (userId)=>{
    //     return new Promise( async (resolve, reject)=>{

    //         const data=await CART.findOne({user:ObjectId(userId)})
    //         if(data.products.length!=0){
    //             const cartTotal= await CART.aggregate([
    //                 {$match:{user:ObjectId(userId)}},
    //                 {$unwind:"$products"},
    //                 {$project:{item:{"$toObjectId": "$products.item"},quantity:"$products.quantity"}},
    //                 {$lookup:{from:'products',localField:'item',foreignField:'_id',as:'product'}},
    //                 {$project:{item:1, quantity:1,product:{$arrayElemAt:['$product',0]}}},
    //                 {$group:{_id:null,total:{$sum:{$multiply:['$quantity','$product.price']}}}}
    //             ])
    //             resolve(cartTotal[0].total)
    //         }else{
    //              resolve(0)
    //          }
    //         // console.log(cartTotal[0].total)
    //     })
    // },

    getCartTotal: (userId)=>{
        return new Promise( async (resolve, reject)=>{

            const data=await CART.findOne({user:ObjectId(userId)})
            if(data.products.length!=0){
                const cart= await CART.aggregate([
                    {$match:{user:ObjectId(userId)}},
                    {$unwind:"$products"},
                    {$project:{item:{"$toObjectId": "$products.item"},quantity:"$products.quantity"}},
                    {$lookup:{from:'products',localField:'item',foreignField:'_id',as:'product'}},
                    {$project:{item:1, quantity:1,product:{$arrayElemAt:['$product',0]}}},
                    
                ])
                console.log(cart)
                let cartTotal = 0
                for(i=0;i<cart.length;i++){
                    if(cart[i].product.discount>0||cart[i].product.catDiscount>0){
                        if(cart[i].product.discount>cart[i].product.catDiscount){
                            cartTotal+=Math.round(cart[i].quantity*cart[i].product.price*0.01*(100-cart[i].product.discount))
                            console.log(`dis - ${cartTotal}`)
                        }else{
                            cartTotal+=Math.round(cart[i].quantity*cart[i].product.price*0.01*(100-cart[i].product.catDiscount))
                            console.log(`catD - ${cartTotal}`)
                        }
                    }else{
                        cartTotal+=cart[i].quantity*cart[i].product.price
                        console.log(`normal - ${cartTotal}`)
                    }
                }
                console.log(cartTotal)
                resolve(cartTotal)
            }else{
                 resolve(0)
             }
            // console.log(cartTotal[0].total)
        })
    },

    getCartSubTotal: (userId,proId,count,quantity)=>{
        console.log('**************')
        return new Promise( async (resolve, reject)=>{
            if(count==-1 && quantity==1){
                resolve(0)
            }else{
                const data= await CART.aggregate([
                    {$match:{user:ObjectId(userId)}},
                    {$unwind:"$products"},
                    {$project:{item:{"$toObjectId": "$products.item"},quantity:"$products.quantity"}},
                    {$match:{item:ObjectId(proId)}},
                    {$lookup:{from:'products',localField:'item',foreignField:'_id',as:'product'}},
                    {$project:{_id:0, quantity:1,product:{$arrayElemAt:['$product',0]}}},
                    {$project:{product:1,quantity:1,subTotal:{$multiply:['$quantity','$product.price']}}}
                ])
                if(data[0].product.discount>0|| data[0].product.catDiscount>0){
                    if(data[0].product.discount>data[0].product.catDiscount){
                        data[0].subTotal=Math.round(data[0].quantity*data[0].product.price*0.01*(100-data[0].product.discount))
                    }else{
                        data[0].subTotal=Math.round(data[0].quantity*data[0].product.price*0.01*(100-data[0].product.catDiscount))
                    }
                    resolve(data[0].subTotal)
                    console.log(`discount sub - ${data[0].subTotal}`)
                }else{
                    console.log(`subtotal - ${data[0].subTotal}`)
                    resolve(data[0].subTotal)
                }
            }
            reject(0)
            console.log(data[0].subTotal)
            console.log('***********************')
        })
    },

    // getCartSubTotal1: (userId,proId)=>{
    //     console.log('**************')
    //     return new Promise( async (resolve, reject)=>{
            
    //             const data= await CART.aggregate([
    //                 {$match:{user:ObjectId(userId)}},
    //                 {$unwind:"$products"},
    //                 {$project:{item:{"$toObjectId": "$products.item"},quantity:"$products.quantity"}},
    //                 {$match:{item:ObjectId(proId)}},
    //                 {$lookup:{from:'products',localField:'item',foreignField:'_id',as:'product'}},
    //                 {$project:{_id:0, quantity:1,product:{$arrayElemAt:['$product',0]}}},
    //                 {$project:{product:1,quantity:1,subTotal:{$multiply:['$quantity','$product.price']}}}
    //             ])
    //             console.log(data)
    //             if(data[0].product.discount>0|| data[0].product.catDiscount>0){
    //                 if(data[0].product.discount>data[0].product.catDiscount){
    //                     data[0].subTotal=data[0].quantity*data[0].product.price*0.01*(100-data[0].product.discount)
    //                 }else{
    //                     data[0].subTotal=data[0].quantity*data[0].product.price*0.01*(100-data[0].product.catDiscount)
    //                 }
    //                 resolve(data[0].subTotal)
    //                 console.log(`discount sub - ${data[0].subTotal}`)
    //             }else{
    //                 console.log(`subtotal - ${data[0].subTotal}`)
    //                 resolve(data[0].subTotal)
    //             }
            
    //     })
    // },


    getCartProductList : (userId)=>{
        return new Promise(async(resolve, reject)=>{
            const cart = await CART.findOne({user:ObjectId(userId)})
            resolve(cart.products)
            console.log(`cart-product ${cart.products[0]}`)
        })
    },


    placeOrder: (order,products,total,delivaryAddress,buynow)=>{
        console.log(order,products,total)
        return new Promise(async(resolve, reject)=>{
            let status = order['payment-method']=='COD'?'placed':'pending',
            addressObj = {
                name:delivaryAddress.details.name,
                phone:delivaryAddress.details.phone,
                address:delivaryAddress.details.address,
                pincode:delivaryAddress.details.pin
            }
            let orderObj = new ORDER({
                user: ObjectId(order.userId),
                paymentMethod:order['payment-method'],
                status:status,
                totalAmount:total,
                delivaryDetails:addressObj,
                products:products,
                date:new Date()
            })
            const orderReg = await orderObj.save()

            if(orderReg.status=='placed'){
                if(!buynow)
                    await CART.updateOne({user:ObjectId(order.userId)},{$set:{products:[]}})
                resolve({'orderId':orderReg._id})
            }else
                resolve({'orderId':orderReg._id})

            


        })
    },

    getOrders: (userId)=>{
        return new Promise(async(resolve, reject)=>{
            let orders = await ORDER.aggregate([{$match:{user:ObjectId(userId)}},{$sort:{date:-1}}])
            resolve(orders)
            console.log(orders)
            console.log(orders.length)
        })
    },

    addNewAddress: (details)=>{
        return new Promise(async(resolve,reject)=>{

            addressObj={
                name:details.name,
                address:details.address,
                phone:details.phone,
                pin:details.pin
            }
            let newAddress = new ADDRESS({
                user:ObjectId(details.userId),
                date:new Date(),
                details:addressObj
            })
            let addressReg = await newAddress.save()
            resolve()
            // console.log(addressReg)

        })
    },

    getAddress: (addressId)=>{
        return new Promise(async(resolve, reject)=>{
            const address = await ADDRESS.findOne({_id:ObjectId(addressId)})
            resolve(address)
        })
    },

    getAddressList: (userId)=>{
        return new Promise(async(resolve, reject)=>{
            const addressList = await ADDRESS.find({user:ObjectId(userId)})
            resolve(addressList)
            // console.log(addressList)
        })
    },

    viewOrder: (orderId)=>{
        return new Promise(async(resolve, reject)=>{
            const order = await ORDER.aggregate([
                {$match:{_id:ObjectId(orderId)}},
                {$unwind:"$products"},
                {$project:{status:1,totalAmount:1,delivaryDetails:1,date:1,item:{"$toObjectId": "$products.item"},quantity:"$products.quantity"}},
                {$lookup:{from:'products',localField:'item',foreignField:'_id',as:'product'}},
                {$project:{status:1,totalAmount:1,delivaryDetails:1,date:1,item:1,quantity:1,product:{$arrayElemAt:['$product',0]}}},
                {$project:{status:1,totalAmount:1,delivaryDetails:1,date:1,item:1,quantity:1,product:1,subTotal:{$multiply:['$quantity','$product.price']}}},

            ])
            resolve(order)
            // console.log(order)
        })
    
    },

    cancelOrder: (orderId)=>{
        return new Promise(async (resolve,reject)=>{
            await ORDER.updateOne({_id:ObjectId(orderId)},{$set:{status:"cancelled"}})
            resolve()
        })
    },

    viewAllOrders: ()=>{
        return new Promise(async(resolve,reject)=>{
            const order = await ORDER.aggregate([
                {$match:{}},{$sort:{'date':-1}}
                
            ])
            resolve(order)
        })
    },

    getProduct:(proId)=>{
        return new Promise(async (resolve,reject)=>{
            const product = await PRODUCT.aggregate([{$match:{_id:ObjectId(proId)}}])
            resolve(product)
            
        })

    },

    addToWishlist :(proId,userId)=>{
        let proObj = {
            item:proId  
        }
        return new Promise(async (resolve, reject)=>{
            let userWishlist = await WISHLIST.findOne({user:ObjectId(userId)})
            if(userWishlist){
                let proExist = userWishlist.products.findIndex(product=>product.item==proId)
                console.log(proExist)
                if(proExist !=-1){
                    resolve()
                }else{
                   await WISHLIST.updateOne({user:ObjectId(userId)},{$push:{products:proObj}})
                    const wishlistCount = await cart_HELPER.wishlistCount(userId)
                    
                    resolve(wishlistCount)
                }
            }else{
                let wishlistObj= new WISHLIST({
                    user:userId,
                    products:[proObj]
                })
                await wishlistObj.save()
                const wishlistCount = await cart_HELPER.wishlistCount(userId)
                
                resolve(wishlistCount)
            }
        })
    },

    getWishlistProducts: (userId)=>{
        return new Promise( async (resolve, reject)=>{

            const wishlistItems= await WISHLIST.aggregate([{$match:{user:ObjectId(userId)}},{$unwind:"$products"},
            {$project:{item:{"$toObjectId": "$products.item"}}},
            {$lookup:{from:'products',localField:'item',foreignField:'_id',as:'product'}},
            {$project:{item:1,product:{$arrayElemAt:['$product',0]}}},
            ])
            resolve(wishlistItems)
            console.log('chek wishlisttitems');
            console.log(ObjectId(userId))
            console.log(wishlistItems);
            console.log(wishlistItems[0].product)
        })
    },

    deleteWishlistProduct: ({cartId,proId})=>{
        console.log(`wishlistID - ${cartId} productId ${proId}`)
        return new Promise((resolve,reject)=>{
            WISHLIST.updateOne({_id:ObjectId(cartId)},{$pull:{products:{item:proId}}
            }).then((response)=>{
                console.log(response)
                resolve({remove:true})
            })
        })

    },

    getNewProducts:()=>{
        return new Promise(async(resolve, reject)=>{
            const data = await PRODUCT.aggregate([{$match:{isActive:true}},{$sort:{date:-1}},{$limit:5}])
            resolve(data)
        })
    },

    getProductPrice:(proId)=>{
        return new Promise(async(resolve,reject)=>{
            const data= await PRODUCT.aggregate([{$match:{_id:ObjectId(proId)}}])
            if(data[0].discount>0||data[0].catDiscount>0){
                if(data[0].discount>data[0].catDiscount){
                    resolve(Math.round(data[0].price*0.01*(100-data[0].discount)))
                }else{
                    resolve(Math.round(data[0].price*0.01*(100-data[0].catDiscount)))
                }
            }else{
                resolve(data[0].price)
            }
        })
    }

}