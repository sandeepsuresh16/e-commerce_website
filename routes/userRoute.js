const express = require("express")
const router = express.Router()
const Register = require('../models/register-user')
const PRODUCT = require('../models/register-product')
const CART =  require('../models/register-cart')
const WISHLIST = require('../models/register-Wishlist')
const { response } = require("express")
const product_HELPER = require('../helpers/product-helper')
const CATEGORY = require("../models/register-category")
const cart_HELPER = require('../helpers/cart-helper')
const fs = require('fs')
const order_HELPER = require('../helpers/order-helper')
const BANNER = require('../models/register-banner')
var ObjectId = require('mongoose').Types.ObjectId
const categoryOfferHelper = require("../helpers/category-offer-helper")
const accountSid = 'AC136eaec376c45c58864b595c8a'
const authToken = '53d4dd367a253d0715040fff0aa'
const client = require('twilio')(accountSid, authToken);
var paypal = require('paypal-rest-sdk');

paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'AfZPjGuAXI1wuVDp12tYg5hi8tNpSn7kQf5bARohaewBvZ9lBnB8opyeK3fha',
    'client_secret': 'ENR9AeTwVU12otT9D7sDegqKrqjd-d7mG-kYQvw-B7VxNe-6clrDu97P08c5QgzQWvI3'
  });



var userSession

const verifyLogin = (req,res,next)=>{
    if(req.session.loggedIn)
        next()
    else
        res.redirect('/login')
}

//get home home page
router.get('/',async (req,res)=>{
    // userSession=req.session
    
    const category = await CATEGORY.find({})
    const newProducts = await product_HELPER.getNewProducts()
    const bestSeller = await order_HELPER.getBestSellingProducts()
    const banner = await BANNER.findOne({})
    console.log(banner)
    try{
        if(req.session.user){
            const data = await Register.findOne({email:req.session.user.email})
            const cartCount = await cart_HELPER.cartCount(req.session.user._id)
            const wishlistCount = await cart_HELPER.wishlistCount(req.session.user._id)
            const category = await CATEGORY.find({})
            
            // console.log(`user data - ${data} ${product}`)
            if(data.isActive==true)
                res.render('user/home',{'logged':true,data,category,cartCount,wishlistCount,newProducts,bestSeller,banner})
            else{
                req.session.destroy()
                res.render('user/login',{'logged':false,'status':"blocked by admin",category})
            }
        }else{
            console.log('@/user')
            res.render('user/home',{'logged':false,category,newProducts,bestSeller,banner})
        }
    }catch(error){
        console.log(error);
        res.render('user/home',{'logged':false,category,newProducts,bestSeller,banner})
    }
})

//SHOP PAGE
router.get('/shop',async(req,res)=>{
    const product = await PRODUCT.find({isActive:true})
    const category = await CATEGORY.find({})
    if(req.session.user){
        const checkUser = await Register.find({_id:ObjectId(req.session.user._id)}) 
        if(checkUser[0].isActive==true){
            const cartCount = await cart_HELPER.cartCount(req.session.user._id)
            const wishlistCount = await cart_HELPER.wishlistCount(req.session.user._id)
            res.render('user/shop',{'logged':true,"data":req.session.user,product,category,cartCount,wishlistCount})
        }else{res.redirect('/')}

    }else{
        res.render('user/shop',{'logged':false,product,category})
    }
})

//SEARCH FROM HOME PAGE
router.post('/search',async(req,res)=>{

    if(req.body.category==""){
        product = await PRODUCT.find({productName:new RegExp(req.body.search),isActive:true})
    }else{
        product = await PRODUCT.find({productName:new RegExp(req.body.search),isActive:true,category:req.body.category})
    }

    const category = await CATEGORY.find({})

    if(req.session.user){
        const checkUser = await Register.find({_id:ObjectId(req.session.user._id)})
        if(checkUser[0].isActive==true){
            const cartCount = await cart_HELPER.cartCount(req.session.user._id)
            const wishlistCount = await cart_HELPER.wishlistCount(req.session.user._id)
            res.render('user/shop',{'logged':true,"data":req.session.user,product,category,cartCount,wishlistCount})
        }else{res.redirect('/')}

    }else{
        res.render('user/shop',{'logged':false,product,category})
    }
})

//login page - user
router.get('/login',async (req,res)=>{
    const category = await CATEGORY.find({})
    if(req.session.user){
            res.redirect('/')
    }else{
        res.render("user/login",{'logged':false,'status':"",category})
    }
    
})

// new user Register
router.post('/signup',async (req, res)=>{
    
    console.log(req.query.phone)
    try {
            const newUser = new Register({
                name:req.body.name,
                email:req.body.email,
                phone:parseInt(req.query.phone),
                password: req.body.password,
                referralCode:Math.floor(Math.random() * 100000000),
                isActive:true,
                isUser:true
            })
            const regUser= await newUser.save()
            const data = await Register.findOne({email:req.body.email,isActive:true})
            let cartObj= new CART({
                user:data._id,
                products:[]
            })
            await cartObj.save()
            let wishlistObj= new WISHLIST({
                user:data._id,
                products:[]
            })
            await wishlistObj.save()

            if(data){
                console.log('p.1')
                if(parseInt(req.body.referral)){
                    console.log('p.1.1')
                    let code = parseInt(req.body.referral)
                    console.log(`code - ${code}`)
                    const userExist = await Register.aggregate([{$match:{referralCode:code}}])
                    if(userExist.length!=0){
                        console.log('p.1.1.1')
                        await Register.updateOne({_id:ObjectId(userExist[0]._id)},{$inc:{wallet:100}})
                        await Register.updateOne({_id:ObjectId(data._id)},{$set:{wallet:100}})
                    }
                }
            }
            req.session.user=data
            req.session.loggedIn=true
            res.redirect('/')
        
    } catch (error) {
        console.log(error)
        req.session.signupError=true
        res.redirect('/signup-otp-page')
    }
})

//Get User Signup page
// router.get('/signup',(req,res)=>{
//     if(userSession){
//         res.redirect('/')
//     }else{
//         res.render("user/signup")
        
//     }
    
// })

//
router.post('/signin',async (req,res)=>{
    const category = await CATEGORY.find({})
    try {
        // let response ={}
        console.log(req.body.email,req.body.password);
        let data = await Register.findOne({email:req.body.email,isUser:true})
        if(data){
            console.log(req.session)
            if(data.password===req.body.password){
                if(!data.isActive){
                    // userSession=req.session
                    req.session.blocked=true
                    res.render("user/login",{'logged':false,'status':"Blocked by Admin",category})
                }
                
                req.session.user=data
                req.session.loggedIn=true
                const cartCount = await cart_HELPER.cartCount(data._id)
                const wishlistCount = await cart_HELPER.wishlistCount(data._id)
                const newProducts = await product_HELPER.getNewProducts()
                const bestSeller = await order_HELPER.getBestSellingProducts()
                const banner = await BANNER.findOne({})

                // const cartCount = await cart_HELPER.cartCount(userSession.data._id)
                // const wishlistCount = await cart_HELPER.wishlistCount(userSession.data._id)
                // const newProducts = await product_HELPER.getNewProducts()
                // const bestSeller = await order_HELPER.getBestSellingProducts()
                // const banner = await BANNER.findOne({})


                res.render('user/home',{'logged':true,data,category,cartCount,wishlistCount,bestSeller,newProducts,banner})
            }else
            res.render("user/login",{'logged':false,'status':"Invalid Credentials",category})
        }else{
            res.render("user/login",{'logged':false,'status':"Invalid Credentials",category})
        }
    } catch (error) {
        console.log(error);
        res.render("user/login",{'logged':false,'status':"Error",category})  
    }
})

//individual product view
router.get('/product/:id',async (req,res)=>{
    const item = await PRODUCT.findOne({_id:req.params.id})
    const category = await CATEGORY.find({})
    if(req.session.user){
        const checkUser = await Register.find({_id:ObjectId(req.session.user._id)})
        if(checkUser[0].isActive==true){
            
                
                const cartCount = await cart_HELPER.cartCount(req.session.user._id)
                const wishlistCount = await cart_HELPER.wishlistCount(req.session.user._id)
                res.render('user/product-default',{'logged':true,item,"data":req.session.user,category,cartCount,wishlistCount})
            
        }else{res.redirect('/')}
    }else{
        console.log('no session-product individual')
        res.render('user/product-default',{'logged':false,item,category})}
})

router.get('/logout', (req, res) => {
    req.session.destroy()
    res.redirect('/')
})

router.get('/otp-login',async (req,res)=>{
    const category = await CATEGORY.find({})
    if(req.session.user){
        res.redirect('/')
    }else{
        res.render('user/otp-login',{"status":"","showOTP":false,'number':1,category})
    }  
})

//get opt for login
router.post('/get-otp', async (req,res)=>{
    const category = await CATEGORY.find({})
    const number = await Register.findOne({phone:req.body.phone})
    if(number){
         client.verify.services('VAd2fce39015666456220f3e709df941e8')
                 .verifications
                 .create({to: `+91${req.body.phone}`, channel: 'sms'})
                 .then(verification => console.log(verification.status))
        // req.session.user=number.name
        res.render('user/otp-login',{"status":"","showOTP":true,"number":req.body.phone,category})
    }else{
        res.render('user/otp-login',{"status":"Phone number not registered",'number':1,"showOTP":false,category})
    }
})

//verify otp for login
router.post('/verify-otp', async(req,res)=>{
    const category = await CATEGORY.find({})
    console.log('in login verify route')
    client.verify.services('VAd2fce39015666456220f3e709df941e8')
      .verificationChecks
      .create({to: `+91${req.body.phone}`, code: req.body.otp})
      .then(verification_check =>{
          console.log(verification_check.status)
          if(verification_check.valid){
            const myPromise =  new Promise((resolve,reject)=>{
                const data = Register.findOne({phone:req.body.phone})
                resolve(data)
            })
            myPromise.then(data=>{
                req.session.user = data
                req.session.loggedIn=true
                res.redirect('/')
            })
            }else{
                res.render('user/otp-login',{"status":"Invalid OTP","showOTP":true,"number":req.body.phone,category})
            }
        })
        .catch((err)=>{
            console.log(err);
            res.render('user/otp-login',{"status":"Error","showOTP":true,"number":req.body.phone,category})
        })  
    })

//SIGNUP PAGE-1

router.get('/signup-otp-page', async(req,res)=>{
    const category = await CATEGORY.find({})
    if(req.session.user){
        res.redirect('/')
    }else{
        res.render('user/signup-reg-otp',{'status':"","showOTP":false,category,'signupError':req.session.signupError})
        req.session.signupError=false
    }
})


//get opt for SIGNUP
router.post('/signupGetOtp', async (req,res)=>{
    const category = await CATEGORY.find({})
    try {
        const number = await Register.findOne({phone:req.body.phone})
        if(!number){
            client.verify.services('VAd2fce39015666456220f3e709df941e8')
                    .verifications
                    .create({to: `+91${req.body.phone}`, channel: 'sms'})
                    .then(verification => console.log(verification.status))
            
            res.render('user/signup-reg-otp',{"status":"","showOTP":true,"number":req.body.phone,category,'signupError':req.session.signupError})
            req.session.signupError=false
        }else{
            res.render('user/signup-reg-otp',{"status":"Registered Number","showOTP":false,category,'signupError':req.session.signupError})
            req.session.signupError=false
        }
        
    } catch (error) {
        console.log(error);
        res.render('user/signup-reg-otp',{"status":"Error","showOTP":false,category,'signupError':req.session.signupError})
        req.session.signupError=false
    }
    
})

//verify otp for registering new user
router.post('/signupVerifyOtp', async (req,res)=>{
    const category = await CATEGORY.find({})
    console.log('in signup verify router');
    client.verify.services('VAd2fce39015666456220f3e709df941e8')
      .verificationChecks
      .create({to: `+91${req.body.phone}`, code: req.body.otp})
      .then(verification_check =>{
        console.log(verification_check.status)
        if(verification_check.valid){
            res.render('user/signup',{'phone':req.body.phone,category})
          }else{
            res.render('user/signup-reg-otp',{"status":"Invalid OTP","showOTP":true,"number":req.body.phone,category,'signupError':req.session.signupError})
            req.session.signupError=false
          }
        })
        .catch((err)=>{
            console.log(err);
            res.render('user/signup-reg-otp',{"status":"Error","showOTP":true,"number":req.body.phone,category,'signupError':req.session.signupError})
            req.session.signupError=false
        })  
    })
   
    //add to cart
    router.get('/addToCart/:id',async (req,res)=>{
        
        if(req.session.user){
            userId=req.session.user._id
            proId = req.params.id
            console.log(`${userId} ${proId}`)
            product_HELPER.addToCart(proId,userId).then(async (data)=>{
                console.log(data)
                const cartCount = await cart_HELPER.cartCount(userId)
                res.json(cartCount)

            })
        }
    })

    //CART
    router.get('/cart', async (req,res)=>{
        const category = await CATEGORY.find({})
        if(req.session.user){
            const checkUser = await Register.find({_id:ObjectId(req.session.user._id)})
            if(checkUser[0].isActive==true){
                
                const cartItem = await product_HELPER.getCartProducts(req.session.user._id)
                const total = await product_HELPER.getCartTotal(req.session.user._id)
                const cartCount = await cart_HELPER.cartCount(req.session.user._id)
                const wishlistCount = await cart_HELPER.wishlistCount(req.session.user._id)
                res.render('user/cart',{'data':req.session.user,total,cartItem,'logged':true,category,cartCount,wishlistCount})
                
            }else
                res.redirect('/')
        }
    })

    //Change product Quntity
    router.post('/change-product-quantity', async (req,res,next)=>{
        console.log(req.body)
        product_HELPER.changeProductQuantity(req.body.cart,req.body.product,req.body.count,req.body.quantity).then(async(response)=>{
            response.total = await product_HELPER.getCartTotal(req.body.userId)
            response.subtotal = await product_HELPER.getCartSubTotal(req.body.userId,req.body.product,req.body.count,req.body.quantity)
            console.log(response)
            res.json(response)
        })
    })

    //delete product from cart
    router.post('/delete-cart-product', (req,res)=>{
        console.log('@delete cart pro route')
        product_HELPER.deleteCartProduct(req.body).then((response)=>{
            res.json(response)
        })
    })

    //place ORDER
    router.post('/place-order-cart',async (req,res)=>{
        console.log('@route')
        console.log(req.body)
        
        const address = await product_HELPER.getAddress(req.body.addressId)
        const products = await product_HELPER.getCartProductList(req.body.userId)
        const total = req.body.cartTotal
        const buynow=false
        const amountPaypal = Math.round(total*0.01375)
        product_HELPER.placeOrder(req.body,products,total,address,buynow).then((response)=>{
            console.log(response)
            if(req.body['payment-method']=='COD'){
                response.COD=true
                res.json(response)
            }else if(req.body['payment-method']=='RASORPAY'){
                if(total>45000){
                    order_HELPER.removeOrder(response.orderId).then(()=>{
                        response.ERROR = true
                        res.json(response)
                    })
                }else{
                    order_HELPER.razorpayPayment(response.orderId,total).then((response)=>{
                        response.RAZORPAY=true
                        res.json(response)
                    })
                }
                
            }else if(req.body['payment-method']=='PAYPAL'){
                var create_payment_json = {
                    "intent": "sale",
                    "payer": {
                        "payment_method": "paypal"
                    },
                    "redirect_urls": {
                        "return_url": "http://sandeep16.online/paypal-success/"+response.orderId,
                        "cancel_url": "http://sandeep16.online/paypal-cancel/"+response.orderId
                    },
                    "transactions": [{
                        "item_list": {
                            "items": [{
                                "name": "item",
                                "sku": "item",
                                "price": amountPaypal,
                                "currency": "USD",
                                "quantity": 1
                            }]
                        },
                        "amount": {


                            "currency": "USD",
                            "total": amountPaypal
                        },
                        "description": "This is the payment description."
                    }]
                };
                 
                 
                paypal.payment.create(create_payment_json, function (error, payment) {
                    if (error) {
                      console.log(error);
                    //   console.log(response.orderId.split('"')[1])
                    res.redirect(`/paypal-cancel/${response.orderId}`)
                    
                    } else {
                      for (let i = 0; i < payment.links.length; i++) {
                        if (payment.links[i].rel === 'approval_url') {
                          res.json({ paypal: true, link: payment.links[i].href })
                        }
                      }
                    }
                  });


            }
            
        })
    })

    //PAYPAL SUCCESS
    router.get('/paypal-success/:orderId',(req,res)=>{
        console.log('@paypal success route')
        order_HELPER.changeOrderStatus(req.params.orderId).then(()=>{
            cart_HELPER.removeCartItems(req.session.user._id).then(()=>{
                console.log('cart items removed')
            })
            res.redirect('/order-complete')
        })
    })

    //PAYPAL CANCEL
    router.get('/paypal-cancel/:orderId',(req,res)=>{
        console.log('@paypal cancel route')
        order_HELPER.removeOrder(req.params.orderId).then(()=>{
            res.redirect('/checkout-page')
        })
        
    })
        //RAZORPAY VERIFY PAYMENT
    router.post('/verify-payment',async (req,res)=>{
        console.log('@verify-payment')
        console.log(req.body)
        order_HELPER.verifyRazorpayPayment(req.body).then((response)=>{
            console.log("successfull Payment")
            order_HELPER.changeOrderStatus(req.body.order.receipt).then(()=>{
                cart_HELPER.removeCartItems(req.session.user._id).then(()=>{
                    console.log('cart items removed')
                })
                res.json({'status':true})
            })
        }).catch(()=>{
            console.log("Payment Failed")
            order_HELPER.removeOrder(req.body.order.receipt)
            res.json({'status':false,'msg':"PAYMENT FAILED"})
        })
    })

    //PLACE ORDER-FROM BUYNOW WINDOW
    router.post('/place-order-buynow',async (req,res)=>{
        console.log('@/place-order-buynow')
        
        if(req.session.user){
            const address = await product_HELPER.getAddress(req.body.addressId)
            const products = [{item:req.body.proId,quantity:1}]
            const productDetail = await product_HELPER.getProduct(req.body.proId)
            const total = req.body.cartTotal
            const amountPaypal = Math.round(total*0.01375)
            const buynow=true
            product_HELPER.placeOrder(req.body,products,total,address,buynow).then((response)=>{
                if(req.body['payment-method']=='COD'){
                    response.COD=true
                    res.json(response)
                }else if(req.body['payment-method']=='RASORPAY'){
                    order_HELPER.razorpayPayment(response.orderId,total).then((response)=>{
                        response.RAZORPAY=true
                        res.json(response)
                    })
                }else if(req.body['payment-method']=='PAYPAL'){
                    var create_payment_json = {
                        "intent": "sale",
                        "payer": {
                            "payment_method": "paypal"
                        },
                        "redirect_urls": {
                            "return_url": "http://sandeep16.online/paypal-buynow-success/"+response.orderId,
                            "cancel_url": "http://sandeep16.online/paypal-cancel/"+response.orderId
                        },
                        "transactions": [{
                            "item_list": {
                                "items": [{
                                    "name": "item",
                                    "sku": "item",
                                    "price": amountPaypal,
                                    "currency": "USD",
                                    "quantity": 1
                                }]
                            },
                            "amount": {
    
    
                                "currency": "USD",
                                "total": amountPaypal
                            },
                            "description": "This is the payment description."
                        }]
                    };
                    paypal.payment.create(create_payment_json, function (error, payment) {
                        if (error) {
                          console.log(error);
                        //   console.log(response.orderId.split('"')[1])
                         res.redirect(`/paypal-cancel/${response.orderId}`)
                        } else {
                          for (let i = 0; i < payment.links.length; i++) {
                            if (payment.links[i].rel === 'approval_url') {
                              res.json({ paypal: true, link: payment.links[i].href })
                            }
                          }
                        }
                      });
     
                }
            })

        }
    })

        //PAYPAL SUCCESS -BUYNOW
        router.get('/paypal-buynow-success/:orderId',(req,res)=>{
            console.log('@paypal-buynow success route')
            order_HELPER.changeOrderStatus(req.params.orderId).then(()=>{
                
                res.redirect('/order-complete')
            })
        })
    



    router.post('/verify-payment-buynow',async (req,res)=>{
        console.log('@verify-payment')
        console.log(req.body)
        order_HELPER.verifyRazorpayPayment(req.body).then((response)=>{
            console.log("successfull Payment")
            order_HELPER.changeOrderStatus(req.body.order.receipt).then(()=>{                
                res.json({'status':true})
            })
        }).catch(()=>{
            console.log("Payment Failed")
            order_HELPER.removeOrder(req.body.order.receipt)
            res.json({'status':false,'msg':"PAYMENT FAILED"})
        })
    })

    //SHOW ORDERS 
    router.get('/order',async(req,res)=>{
        const category = await CATEGORY.find({})
        const data = await Register.findOne({email:req.session.user.email})
        const cartCount = await cart_HELPER.cartCount(req.session.user._id)
        const wishlistCount = await cart_HELPER.wishlistCount(req.session.user._id)
        if(req.session.user){
            const checkUser = await Register.find({_id:ObjectId(req.session.user._id)})
            if(checkUser[0].isActive==true){
                product_HELPER.getOrders(req.session.user._id).then((orders)=>{
                    res.render('user/order',{'logged':true,data,orders,category,cartCount,wishlistCount})
                })
            }else
                res.redirect('/')
        }else{
            res.redirect('/login')
        }
    })

    //ON RAZORPAY MODAL CLOSE
    router.post('/cancel-razorpay-payment',(req,res)=>{
        console.log(req.body)
        order_HELPER.removeOrder(req.body.orderId).then(()=>{
            res.json({})
        })
    })

    //ADD NEW ADDRESS
    router.post('/add-new-address',async(req,res)=>{
        product_HELPER.addNewAddress(req.body).then(()=>{
            res.json(true)
        })

    })

    //GET CHECKOUT PAGE
    router.get('/checkout-page',async(req,res)=>{
        if(req.session.user){
            const checkUser = await Register.find({_id:ObjectId(req.session.user._id)})
            if(checkUser[0].isActive==true){
                const address = await product_HELPER.getAddressList(req.session.user._id)
                const total = await product_HELPER.getCartTotal(req.session.user._id)
                const cartItem = await product_HELPER.getCartProducts(req.session.user._id)
                const wishlistCount = await cart_HELPER.wishlistCount(req.session.user._id)
                const cartCount = await cart_HELPER.cartCount(req.session.user._id)
                console.log(cartItem)
                const category = await CATEGORY.find({})
                const data = await Register.findOne({email:req.session.user.email,isUser:true})

                res.render('user/checkout',{'logged':true,address,total,cartCount,cartItem,category,data,wishlistCount})
                
            }else
                res.redirect('/')
        }else{
            res.redirect('/')
        }
    })

    //VIEW ORDER
    router.get('/view-order/:orderId', async(req,res)=>{
        if(req.session.user){
            const category = await CATEGORY.find({})
            const data = await Register.findOne({email:req.session.user.email,isUser:true})
            const order = await product_HELPER.viewOrder(req.params.orderId)
            const total = await product_HELPER.getCartTotal(req.session.user._id)
            const cartCount = await cart_HELPER.cartCount(req.session.user._id)
            const wishlistCount = await cart_HELPER.wishlistCount(req.session.user._id)
            res.render('user/view-order',{'logged':true,category,data,order,total,cartCount,wishlistCount})
        }
        else{
            res.redirect('/login')
        }
    })

    //CANCEL ORDER
    router.get('/order/cancel',async(req,res)=>{
        console.log(`orderId:${req.query.orderId}`)
        if(req.session.user){
            const checkUser = await Register.find({_id:ObjectId(req.session.user._id)})
            if(checkUser[0].isActive==true){
                product_HELPER.cancelOrder(req.query.orderId).then(()=>{
                    res.redirect('/order')
                })
            }else  
                res.redirect('/')
        }else{
            req.redirect('/login')
        }
    })


    //GET USER PROFILE
    router.get('/account',async (req,res)=>{
        if(req.session.user){
            const checkUser = await Register.find({_id:ObjectId(req.session.user._id)})
            if(checkUser[0].isActive==true){
                const category = await CATEGORY.find({})
                const cartCount = await cart_HELPER.cartCount(req.session.user._id)
                const wishlistCount = await cart_HELPER.wishlistCount(req.session.user._id)
                res.render('user/my-account',{'logged':true,'data':req.session.user,category,cartCount,wishlistCount})
            }else
                res.redirect('/')
        }
        else
            res.redirect('/login')
    })

    //ORDER-COMPLETE ACKNOWLEDGEMENT
    router.get('/order-complete',async(req,res)=>{
        if(req.session.user){
            const cartCount = await cart_HELPER.cartCount(req.session.user._id)
            const wishlistCount = await cart_HELPER.wishlistCount(req.session.user._id)
            const category = await CATEGORY.find({})
            const data = await Register.findOne({email:req.session.user.email,isUser:true})
            res.render('user/order-complete',{'logged':true,category,data,cartCount,wishlistCount})
            
           
        }else{
            res.redirect('/login')
        }
        
    })

    // SEARCH PRODUCTS BY CATEGORY 
    router.get('/display-category',async(req,res)=>{
        const product = await PRODUCT.find({category:req.query.categoryName,isActive:true})
        console.log(product)
        const category = await CATEGORY.find()
        if(req.session.user){
            const checkUser = await Register.find({_id:ObjectId(req.session.user._id)})
            if(checkUser[0].isActive==true){
                const cartCount = await cart_HELPER.cartCount(req.session.user._id)
                const wishlistCount = await cart_HELPER.wishlistCount(req.session.user._id)
                res.render('user/shop',{'logged':true,category,product,'data':req.session.user,cartCount,wishlistCount})
            }else{res.redirect('/')}
        }else{
            res.render('user/shop',{'logged':false,category,product})
        }
    })

    //SEARCH PRODUCTS - LESS THAN
    router.get('/product_less_than', async(req,res)=>{
        const product = await PRODUCT.find({price:{$lte:500},isActive:true})
        console.log(product)
        const category = await CATEGORY.find()
        if(req.session.user){
            const checkUser = await Register.find({_id:ObjectId(req.session.user._id)})
            if(checkUser[0].isActive==true){
                const cartCount = await cart_HELPER.cartCount(req.session.user._id)
                const wishlistCount = await cart_HELPER.wishlistCount(req.session.user._id)
                res.render('user/shop',{'logged':true,category,product,'data':req.session.user,cartCount,wishlistCount})
            }else
                res.redirect('/')
        }else{
            res.render('user/shop',{'logged':false,category,product})
        }
    })

    //SEARCH PRODUCTS - GREATER THAN
    router.get('/product_more_than', async(req,res)=>{
        const product = await PRODUCT.find({price:{$gte:10000},isActive:true})
        console.log(product)
        const category = await CATEGORY.find()
        if(req.session.user){
            const checkUser = await Register.find({_id:ObjectId(req.session.user._id)})
            if(checkUser[0].isActive==true){
                const cartCount = await cart_HELPER.cartCount(req.session.user._id)
                const wishlistCount = await cart_HELPER.wishlistCount(req.session.user._id)
                res.render('user/shop',{'logged':true,category,product,'data':req.session.user,cartCount,wishlistCount})
            }else   
                res.redirect('/')
        }else{
            res.render('user/shop',{'logged':false,category,product})
        }
    })

    
    //SEARCH PRODUCTS - RANGE
    router.post('/product_range_random', async(req,res)=>{
        console.log(req.body.min)
        const product = await PRODUCT.find({$and:[
            {price:{$gte:req.body.min}},
            {price:{$lte:req.body.max}}
        ],isActive:true})
       
        const category = await CATEGORY.find()
        if(req.session.user){
            const checkUser = await Register.find({_id:ObjectId(req.session.user._id)})
            if(checkUser[0].isActive==true){
                const cartCount = await cart_HELPER.cartCount(req.session.user._id)
                const wishlistCount = await cart_HELPER.wishlistCount(req.session.user._id)
                res.render('user/shop',{'logged':true,category,product,'data':req.session.user,cartCount,wishlistCount})
            }else
                res.redirect('/')
        }else{
            res.render('user/shop',{'logged':false,category,product})
        }
    })

    //SEARCH BAR
    router.post('/product_search', async(req,res)=>{
        const product = await PRODUCT.find({productName:new RegExp(req.body.search),isActive:true})
        console.log(product)
        const category = await CATEGORY.find()
        if(req.session.user){
            const checkUser = await Register.find({_id:ObjectId(req.session.user._id)})
            if(checkUser[0].isActive==true){
                const cartCount = await cart_HELPER.cartCount(req.session.user._id)
                const wishlistCount = await cart_HELPER.wishlistCount(req.session.user._id)
                res.render('user/shop',{'logged':true,category,product,'data':req.session.user,cartCount,wishlistCount})
            }else
                res.redirect('/')
        }else{
            res.render('user/shop',{'logged':false,category,product})
        }
    })

    //SEARCH SUBCATEGORY
    router.get('/search-subcategory', async(req,res)=>{
        const product = await PRODUCT.find({categoryName:req.query.cat,subCategory:req.query.subcat,isActive:true})
        const category = await CATEGORY.find({})
        if(req.session.user){
            const checkUser = await Register.find({_id:ObjectId(req.session.user._id)})
            if(checkUser[0].isActive==true){
                const cartCount = await cart_HELPER.cartCount(req.session.user._id)
                const wishlistCount = await cart_HELPER.wishlistCount(req.session.user._id)
                res.render('user/shop',{'logged':true,category,product,'data':req.session.user,cartCount,wishlistCount})
            }
        }else{
            res.render('user/shop',{'logged':false,category,product})
        }
    })

    //SEARCH PRODUCTS - RANGE
    router.get('/product_range', async(req,res)=>{
        const product = await PRODUCT.find({$and:[
            {price:{$gte:req.query.min}},
            {price:{$lte:req.query.max}}
        ],isActive:true})
        
        const category = await CATEGORY.find()
        if(req.session.user){
            const checkUser = await Register.find({_id:ObjectId(req.session.user._id)})
            if(checkUser[0].isActive==true){
                const cartCount = await cart_HELPER.cartCount(req.session.user._id)
                const wishlistCount = await cart_HELPER.wishlistCount(req.session.user._id)
                res.render('user/shop',{'logged':true,category,product,'data':req.session.user,cartCount,wishlistCount})
            }
        }else{
            res.render('user/shop',{'logged':false,category,product})
        }
    })

    //BUY NOW - LOGGED IN USER
    router.get('/buy-now/:proId', async (req,res)=>{
        if(req.session.user){
            const checkUser = await Register.find({_id:ObjectId(req.session.user._id)})
            if(checkUser[0].isActive==true){
                const product = await product_HELPER.getProduct(req.params.proId)
                const address = await product_HELPER.getAddressList(req.session.user._id)
                const wishlistCount = await cart_HELPER.wishlistCount(req.session.user._id)
                const total = await product_HELPER.getProductPrice(req.params.proId)
                const category = await CATEGORY.find({})
                const cartCount = await cart_HELPER.cartCount(req.session.user._id)
                const data = await Register.findOne({email:req.session.user.email,isUser:true})                
                res.render('user/checkout-buynow',{'logged':true,address,total,product,category,data,wishlistCount,cartCount})
                
            }
            else{res.redirect('/')}
        }else{
            res.redirect('/login')
        }    
    })

    //ADD TO WISHLIST
    router.get('/user/wishlist-add/:proId',async(req,res)=>{
        
        if(req.session.user){
            const checkUser = await Register.find({_id:ObjectId(req.session.user._id)})
            const wishlistCount = await cart_HELPER.wishlistCount(req.session.user._id)
            if(checkUser[0].isActive==true){
                product_HELPER.addToWishlist(req.params.proId,req.session.user._id).then((wishlistCount)=>{
                    
                    res.json(wishlistCount)
                })

            }
            else{res.redirect('/')}
        }
    })

    //GET WISHLIST
    router.get('/user/wishlist',async(req,res)=>{
        if(req.session.user){
            const checkUser = await Register.find({_id:ObjectId(req.session.user._id)})
            if(checkUser[0].isActive==true){
                const category = await CATEGORY.find({})
                const cartCount = await cart_HELPER.cartCount(req.session.user._id)
                const wishlistCount = await cart_HELPER.wishlistCount(req.session.user._id)
                const wishlistItem = await product_HELPER.getWishlistProducts(req.session.user._id)
                res.render('user/wishlist',{'logged':true,category,cartCount,"data":req.session.user,wishlistCount,wishlistItem})
            }else{res.redirect('/')}
        }else{res.redirect('/')}
    })

    //USER ADDRESS
    router.get('/user/address', async(req,res)=>{
        if(req.session.user){
            const checkUser = await Register.find({_id:ObjectId(req.session.user._id)})
            if(checkUser[0].isActive==true){
                const category = await CATEGORY.find({})
                const cartCount = await cart_HELPER.cartCount(req.session.user._id)
                const wishlistCount = await cart_HELPER.wishlistCount(req.session.user._id)
                const addressList = await product_HELPER.getAddressList(req.session.user._id)
                res.render('user/address',{'logged':true,'data':req.session.user,category,cartCount,wishlistCount,addressList})
            }else{res.redirect('/')}
        }else{res.redirect('/')}
    })

    //USER WALLET
    router.get('/user/wallet', async(req,res)=>{
        if(req.session.user){
            const checkUser = await Register.find({_id:ObjectId(req.session.user._id)})
            if(checkUser[0].isActive==true){
                const category = await CATEGORY.find({})
                const cartCount = await cart_HELPER.cartCount(req.session.user._id)
                const wishlistCount = await cart_HELPER.wishlistCount(req.session.user._id) 
                res.render('user/wallet',{'logged':true,'data':req.session.user,category,cartCount,wishlistCount})
            }else{res.redirect('/')}
        }else{res.redirect('/')}
    })

    //CHANGE ACCOUNT DETAILS OF USER
    router.get('/user/account/details', async(req,res)=>{
        if(req.session.user){
            const checkUser = await Register.find({_id:ObjectId(req.session.user._id)})
            if(checkUser[0].isActive==true){
                const category = await CATEGORY.find({})
                const cartCount = await cart_HELPER.cartCount(req.session.user._id)
                const wishlistCount = await cart_HELPER.wishlistCount(req.session.user._id)
                const addressList = await product_HELPER.getAddressList(req.session.user._id)
                res.render('user/account-details',{'logged':true,'data':req.session.user,category,cartCount,wishlistCount,addressList})
            }else{res.redirect('/')}
        }else{res.redirect('/')}
    })

    //DELETE WISHLIST ITEM
    router.post('/delete-wishlist-product', (req,res)=>{
        console.log('@delete wishlist product route')
        console.log(req.body)
        product_HELPER.deleteWishlistProduct(req.body).then((response)=>{
            res.json(response)
        })
    })

    //DELETE address
    router.post('/user/address-delete',(req,res)=>{
        order_HELPER.deleteAddress(req.body.addressId,req.session.user._id).then(()=>{
            res.json({})
        })
    })

    //EDIT ADDRESS
    router.post('/user/address-edit',(req,res)=>{
        order_HELPER.editAddress(req.body).then(()=>{
            res.redirect('/user/address')
        })
    })

    //ADD NEW ADDRESS FROM USER PROFILE
    router.post('/user/address-add',(req,res)=>{
        order_HELPER.addAddress(req.body,req.session.user._id).then(()=>{
            res.redirect('/user/address')
        })
    })

    //CHANGE USER NAME
    router.post('/user/name-change',async(req,res)=>{
        await Register.updateOne({_id:ObjectId(req.session.user._id)},{$set:{'name':req.body.name}})
        
        res.json({success:true})
    })

    //CHANGE PASSWORD
    router.post('/user/password-change',async(req,res)=>{
        await Register.updateOne({_id:ObjectId(req.session.user._id)},{$set:{'password':req.body.name}})

        res.json({success:true})
    })

    //CHECK EMAIL ADDRESS IF PRESENT OR NOT
    router.post('/check-email',async(req,res)=>{
        const data= await Register.aggregate([{$match:{email:req.body.email}}])
        if(data.length==0){
            console.log(data[0])
            res.json({success:true})
        }else{
            res.json({success:false})
        }
    })

    //CHANGE EMAIL-ID BY USER
    router.post('/change-email',async(req,res)=>{
        await Register.updateOne({_id:ObjectId(req.session.user._id)},{'email':req.body.email})
        res.json({changed:true})

    })

    //APPLY COUPON CODE
    router.post('/apply-coupon',(req,res)=>{
        console.log(req.body)
        categoryOfferHelper.applyCoupon(req.body,req.session.user._id).then((response)=>{
            res.json(response)
        })
    })

    //USE WALLET
    router.get('/redeem-wallet',(req,res)=>{
        console.log(req.query.total)
        categoryOfferHelper.redeemWallet(req.session.user._id,req.query.total).then((response)=>{
            res.json(response)
        })
        
    })

    //PROFILE PICTURE
    router.post('/profile-image',(req,res)=>{
        if(req.session.user){
            if(req.body.image1){
                let image1= req.body.image1
                let path1= './public/user-profile-img/'+req.session.user._id+'.jpg'
                let img1= image1.replace(/^data:([A-Za-z+/]+);base64,/,"")
                fs.writeFileSync(path1, img1, {encoding: 'base64'})
            }
            res.redirect('/user/account/details')
        }else{
            res.redirect('/')
        }
    })
    
    
module.exports = router
