const express = require("express")
// const session = require("express-session")
const router = express.Router()
const Register = require('../models/register-user')
const PRODUCT = require('../models/register-product')
const CATEGORY = require('../models/register-category')
const CART =  require('../models/register-cart')
const TITLE = require('../models/register-banner')
const productHelper = require("../helpers/product-helper")
var ObjectId = require('mongoose').Types.ObjectId
const ORDER = require("../models/register-order")
const product_HELPER = require('../helpers/product-helper')
const order_HELPER = require('../helpers/order-helper')
const categoryOffer_HELPER = require('../helpers/category-offer-helper')
const fs = require('fs')
const OFFERCATEGORY = require("../models/register-categoryOffer")
const OFFERPRODUCT = require('../models/register-productOffer')
const COUPON = require('../models/register-coupon')
var adminSession

router.get('/',async(req,res)=>{
    const title = await TITLE.findOne({})
    console.log(title)
    
    if(adminSession){
        console.log('point-admin with session @/');
        const salesToday = await order_HELPER.getTodaysSale()
        const salesNumber = await order_HELPER.getTodaysSaleCount()
        const customers = await order_HELPER.getCustomerCount()
        const newOrders = await order_HELPER.getLatestOrders()
        const topSellers = await order_HELPER.topSellingProducts()
        const newSales = await order_HELPER.TodaysLatestSale()
       
        // const weeklySalesCount = await order_HELPER.salesCount()
        res.render('admin/pages-dashboard',{salesToday,salesNumber,customers,newOrders,topSellers,newSales})
    }else{
        console.log('point-@/');
        res.render('admin/admin-login',{'error':req.session.adminLoginError})
        req.session.adminLoginError=false
    }    
})

router.post('/signin', async (req, res)=>{
    try {
        email = req.body.email
        password = req.body.password
        console.log(email,password);
        let data = await Register.findOne({email:req.body.email,isAdmin:true,isUser:false})
        if(data){
            console.log(data);
            if(data.password === password){
                adminSession = req.session
                adminSession.user=data.name
                console.log('point-admin with session @/');
                const salesToday = await order_HELPER.getTodaysSale()
                const salesNumber = await order_HELPER.getTodaysSaleCount()
                const customers = await order_HELPER.getCustomerCount()
                const newOrders = await order_HELPER.getLatestOrders()
                const topSellers = await order_HELPER.topSellingProducts()
                const newSales = await order_HELPER.TodaysLatestSale()
                // const weeklySalesCount = await order_HELPER.salesCount()
                // console.log(`wekk ${weeklySalesCount}`)
                res.render('admin/pages-dashboard',{data,salesToday,salesNumber,customers,newOrders,topSellers,newSales})
            }else {
                req.session.adminLoginError=true
                console.log('point-1');
                res.redirect('/admin')
            }
        }
        else{
            req.session.adminLoginError=true
            console.log('point-2');
            res.redirect('/admin')
        }
    } catch (error) {
        console.log(error);
        console.log('point-3');
        res.redirect('/admin')
    }
})

router.get('/products', async (req,res)=>{
    if(adminSession.user){
        const product = await PRODUCT.find({isActive:true})
        const catOffer = await OFFERPRODUCT.aggregate([{$match:{expDate:{$gte:new Date()}}}])
        // console.log(product)
        res.render('admin/pages-product',{product,catOffer})
    }else{
        res.redirect('/admin')
    }
})

//search product
router.post('/searchProduct', async (req, res)=>{
    if(adminSession.user){
        const product = await PRODUCT.find({productName: new RegExp(req.body.search),isActive:true})
        if(product){
            res.render('admin/pages-product',{product})
        }else{
            res.redirect('/admin/products')
        }
    }else
        res.redirect('/admin')
})

//page to add new product
router.get('/products/add',async (req,res)=>{
    if(adminSession.user){
        const data = await CATEGORY.find({isActive:true})
        console.log(data);
        res.render('admin/pages-add-product',{data})
    }else{
        res.redirect('/admin')
    }
})

//add new product    
router.post('/products/add',async (req,res)=>{
    
    try {
        const newProduct = new PRODUCT({
            productName:req.body.productName,
            brand:req.body.brand,
            category:req.body.category,
            subCategory:req.body.subCategory,
            price:req.body.price,
            quantity:req.body.quantity,
            description:req.body.description,
            isActive:true,
            inStock:true,
            discount:0,
            catDiscount:0
        })
        const newProd = await newProduct.save()
        console.log('regNewProduct '+newProduct._id)
        let image1= req.body.image1
        let image2= req.body.image2
        let image3= req.body.image3
        let image4= req.body.image4

        let path1= './public/product-image/'+newProd._id+'_1.jpg'
        let path2= './public/product-image/'+newProd._id+'_2.jpg'
        let path3= './public/product-image/'+newProd._id+'_3.jpg'
        let path4= './public/product-image/'+newProd._id+'_4.jpg'

        let img1= image1.replace(/^data:([A-Za-z+/]+);base64,/,"")
        let img2= image2.replace(/^data:([A-Za-z+/]+);base64,/,"")
        let img3= image3.replace(/^data:([A-Za-z+/]+);base64,/,"")
        let img4= image4.replace(/^data:([A-Za-z+/]+);base64,/,"")

        fs.writeFileSync(path1, img1, {encoding: 'base64'})
        fs.writeFileSync(path2, img2, {encoding: 'base64'})
        fs.writeFileSync(path3, img3, {encoding: 'base64'})
        fs.writeFileSync(path4, img4, {encoding: 'base64'})
        // req.files.img1.mv('./public/product-image/'+newProd._id+'_1.jpg')
        // req.files.img2.mv('./public/product-image/'+newProd._id+'_2.jpg')
        // req.files.img3.mv('./public/product-image/'+newProd._id+'_3.jpg')
        // req.files.img4.mv('./public/product-image/'+newProd._id+'_4.jpg')
        // PRODUCT.on('save',async (addedProduct)=>{
        

        res.redirect('/admin/products')
        alert('product added')
        
    } catch (error) {
        console.log(error);
        res.redirect('/admin/products/add')
    }  
})

//edit product
router.get('/products/edit/:productID', async (req,res)=>{
    if(adminSession.user){
        const categoryData = await CATEGORY.find({isActive:true})
        const productData = await PRODUCT.findById(req.params.productID)
        console.log(categoryData);
        console.log(productData);
        res.render('admin/pages-edit-product copy',{'pID':req.params.productID,categoryData,productData})
    }else{
        res.redirect('/admin')
    }
})

//editing product
router.post('/products/edit/:productID', async (req,res)=>{
    try{
        if(adminSession.user){
            const data = await PRODUCT.findByIdAndUpdate({_id:req.params.productID},{
                $set:{
                    productName:req.body.productName,
                    brand:req.body.brand,
                    category:req.body.category,
                    subCategory:req.body.subCategory,
                    price:req.body.price,
                    quantity:req.body.quantity,
                    description:req.body.description
                }
            })
            // console.log(req.files)
            // if(req.files.img1){req.files.img1.mv('./public/product-image/'+req.params.productID+'_1.jpg')}
            // if(req.files.img2){req.files.img2.mv('./public/product-image/'+req.params.productID+'_2.jpg')}
            // if(req.files.img3){req.files.img3.mv('./public/product-image/'+req.params.productID+'_3.jpg')}
            // if(req.files.img4){req.files.img4.mv('./public/product-image/'+req.params.productID+'_4.jpg')}
            if(req.body.image1){
                let image1= req.body.image1
                let path1= './public/product-image/'+req.params.productID+'_1.jpg'
                let img1= image1.replace(/^data:([A-Za-z+/]+);base64,/,"")
                fs.writeFileSync(path1, img1, {encoding: 'base64'})
            }
            if(req.body.image2){
                let image2= req.body.image2
                let path2= './public/product-image/'+req.params.productID+'_2.jpg'
                let img2= image2.replace(/^data:([A-Za-z+/]+);base64,/,"")
                fs.writeFileSync(path2, img2, {encoding: 'base64'})
            }
            if(req.body.image3){
                let image3= req.body.image3
                let path3= './public/product-image/'+req.params.productID+'_3.jpg'
                let img3= image3.replace(/^data:([A-Za-z+/]+);base64,/,"")
                fs.writeFileSync(path3, img3, {encoding: 'base64'})
            }
            if(req.body.image4){
                let image4= req.body.image4
                let path4= './public/product-image/'+req.params.productID+'_4.jpg'
                let img4= image4.replace(/^data:([A-Za-z+/]+);base64,/,"")
                fs.writeFileSync(path4, img4, {encoding: 'base64'})
            }
            // let path1= './public/product-image/'+newProd._id+'_1.jpg'
            // let img1= image1.replace(/^data:([A-Za-z+/]+);base64,/,"")
            // fs.writeFileSync(path1, img1, {encoding: 'base64'})
            

            res.redirect('/admin/products')
        }else{
            res.redirect('/admin')
        }
    }catch(err){
        console.log(err)
        res.redirect('/admin/products')
    }
})

//delete product
// router.get('/products/delete/:id', async (req, res) => {
    
//     await PRODUCT.updateOne({_id:ObjectId(req.params.id)},{$set:{isActive:false}})
//     await CART.updateMany({'products.item':req.params.id},{$pull:{'products':{'item':req.params.id}}})
//     res.redirect('/admin/products')

// })

router.post('/products/delete', async (req, res) => {
    
    await PRODUCT.updateOne({_id:ObjectId(req.body.id)},{$set:{isActive:false}})
    await CART.updateMany({'products.item':req.body.id},{$pull:{'products':{'item':req.body.id}}})
    res.json({status:true})

})


// category page
router.get('/category', async (req,res)=>{
    if(adminSession.user){
        const data = await CATEGORY.find({})
        res.render('admin/pages-category',{data})
    }else(
        res.redirect('/admin')
    )  
})

//search category
router.post('/searchCategory', async (req, res)=>{
    if(adminSession.user){
        const data = await CATEGORY.find({categoryName: new RegExp(req.body.search)})
        if(data){
            res.render('admin/pages-category',{data})
        }else{
            res.redirect('/admin/category')
        }
    }else
        res.redirect('/')
})

//add new category
router.post('/category/add',async (req,res)=>{
    if(adminSession.user){
        try {
            const newCategory = new CATEGORY({
                categoryName:req.body.category.toUpperCase(),
                isActive:req.body.status
            })
            const newCat = await newCategory.save()
            console.log(newCat);
            res.redirect('/admin/category')
            
        } catch (error) {
            console.log(error)
            res.redirect('/admin/category')
            
        }
    }
    res.render('admin/pages-category')
})

//edit category
router.post('/category/edit', async (req,res)=>{
    console.log(req.body.currentName)
    console.log(req.body.category)
    console.log(req.body.status)
    await CATEGORY.updateOne({categoryName:req.body.currentName}, {$set:{categoryName:req.body.category,isActive:req.body.status}})
    await PRODUCT.updateMany({category:req.body.currentName},{$set:{category:req.body.category}})
    res.redirect('/admin/category')
})

//delete category
router.get('/category/delete/:id/:categoryName',async (req,res)=>{
    if(adminSession.user){
        await CATEGORY.deleteOne({_id:req.params.id})
        await PRODUCT.updateMany({category:req.params.categoryName},{$set:{category:""}})
        res.redirect('/admin/category')
    }else{res.redirect('/admin')}
})

//sub-category
router.get('/category/subCategory/:id', async (req,res)=>{
    if(adminSession.user){
        const category = await CATEGORY.findById(req.params.id)
        console.log(category);
        res.render('admin/pages-sub-category',{category})
    }
    else{res.redirect('/admin/category')}
})

//add new sub-category
router.post('/category/subCateory/add/:id', async (req,res)=>{
    await CATEGORY.findByIdAndUpdate(req.params.id,{$push:{subCategory:req.body.subCategory}})
    const category = await CATEGORY.findById(req.params.id)
    console.log(category);
    res.render('admin/pages-sub-category',{category})
})

//delete sub category
router.get('/category/subCategory/delete/:id/:subcategory/:category', async (req,res)=>{
    await CATEGORY.findByIdAndUpdate(req.params.id,{$pull:{subCategory:req.params.subcategory}})
    await PRODUCT.updateMany({category:req.params.category,subCategory:req.params.subcategory},{$set:{subCategory:""}})
    console.log(req.params.id)
    res.redirect(`/admin/category/subCategory/${req.params.id}`)
})

//find sub category using ajax
router.post('/getSubCategory', async (req, res)=>{
    console.log('ajax data',req.body)
    const data = await CATEGORY.findOne({categoryName:req.body.category})
    console.log(data);
    sub=data.subCategory
    console.log(sub)
    res.json(sub)
})

//user management page
router.get('/user',async (req,res)=>{
    if(adminSession.user){
        const users = await Register.find({isUser:true})
        res.render('admin/pages-users',{users})
    }else{
        res.redirect('/admin')
    }
    
})

//block user
router.get('/user/block/:id', async (req,res)=>{
    if(adminSession.user){
        await Register.findByIdAndUpdate({_id:req.params.id},{$set:{isActive:false}})
        res.redirect('/admin/user')
    }
    else{req.redirect('/admin')}
})

//unblock user
router.get('/user/unblock/:id', async (req,res)=>{
    if(adminSession.user){
        await Register.findByIdAndUpdate({_id:req.params.id},{$set:{isActive:true}})
        res.redirect('/admin/user')
    }
    else{req.redirect('/admin')}
})

//delete user
router.get('/user/delete/:id',async (req,res)=>{
    if(adminSession.user){
        await Register.deleteOne({_id:req.params.id})
        res.redirect('/admin/user')
    }else{res.redirect('/admin')}
})

//search user from admin dashboard
router.post('/searchUser', async (req, res)=>{
        if(adminSession.user){
            const users = await Register.find({name: new RegExp(req.body.search)})
            if(users){
                res.render('admin/pages-users',{users})
            }else{
                res.redirect('/admin/user')
            }
        }else
            res.redirect('/')
})

//VIEW ALL ORDERS
router.get('/order',async(req,res)=>{
    if(adminSession.user){
        const order = await productHelper.viewAllOrders()
        res.render('admin/pages-order',{order})
    }else{
        redirect('/admin')
    }
})

//search order from admin dashboard
router.post('/searchOrder', async (req, res)=>{
    try{
        console.log(req.body.search)
        if(adminSession){
            const order = await ORDER.find({_id:ObjectId(req.body.search)})
            console.log('..search order')
            console.log(order)
            if(order){
                res.render('admin/pages-order',{order})
            }else{
                res.redirect('/admin/order')
            }
        }else
            res.redirect('/')
    }catch(err){
        console.log(err)
        res.redirect('/admin/order')
    }
})
//CHANGE ORDER STATUS
router.post('/order/change-status', async(req,res)=>{
    console.log(req.body)
    if(adminSession){
        await ORDER.updateOne({_id:ObjectId(req.body.orderId)},{$set:{status:req.body.status}})
        res.json(true)
    }
})

//GET ORDER DETAILS
router.get('/view-order/:orderId', async(req,res)=>{
    if(adminSession){
        const order = await product_HELPER.viewOrder(req.params.orderId)
        console.log(order)
        res.render('admin/order-details',{order})
    }
    else{
        res.redirect('/admin')
    }
})

//GET REPORT
router.get('/report',async(req, res)=>{
    if(adminSession){
        const data = await order_HELPER.getOrder()
        res.render('admin/pages-report_1',{data})
    }
})

//GET REPORT-SORTED
router.get('/report/sort', (req,res)=>{
    if(adminSession){
        const type=req.query.type
        console.log(type)
        order_HELPER.getOrderSorted(type).then((data)=>{
        res.render('admin/pages-report_1',{data})
        })
    }
})

//GET ORDER BETWEEN A RANGE
router.post('/report/sort-range', (req,res)=>{
    console.log(req.body.to)
    if(adminSession){
        order_HELPER.getOrderSortedRange(req.body.from,req.body.to).then((data)=>{
            res.render('admin/pages-report_1',{data})
        })
    }
})

//logout
router.get('/logout', (req, res) => {
    req.session.destroy()
    adminSession.user = undefined
    adminSession = undefined
    res.redirect('/admin')
})

router.post('/dashboard/weeklyReport',async(req,res)=>{
    console.log('evide vannu')
    const data= await order_HELPER.getWeeklySalesNumber()
    const dataRevenue = await order_HELPER.getWeeklySales()
    const data1 = await order_HELPER.getWeeklyCancelledOrder()
    const data2 =  await order_HELPER.getWeeklyPlacedOrder()
    const data3 =  await order_HELPER.getWeeklyDeliveredOrder()
    const data4 =  await order_HELPER.getWeeklyShippedOrder()
    res.json({data,data1,data2,data3,data4,dataRevenue})
    
})

//add new category offer

router.post('/offer-category/add',(req,res)=>{
    console.log(req.body)
    categoryOffer_HELPER.addNewCategoryOffer(req.body).then((response)=>{
        if(response.status=='error'){
            res.json(response)
        }else{
            
            res.json(response)
            
        }

    })

})

//ADD NEW PRODUCT OFFER
router.post('/offer-product/add',(req,res)=>{
    console.log(req.body)
    categoryOffer_HELPER.addNewProductOffer(req.body).then((response)=>{
        if(response.status=='error'){
            res.json(response)
        }else{
            res.json(response)
        }
    })
})

//ADD NEW COUPON
router.post('/coupon/add',(req,res)=>{
    categoryOffer_HELPER.addNewCoupon(req.body).then((response)=>{
        res.json(response)
    })
})

//CATEGORY OFFER
router.get('/offer-category',async(req,res)=>{
    if(adminSession){
        const category = await CATEGORY.find({})
         const catOffer = await OFFERCATEGORY.aggregate([{$match:{expDate:{$gte:new Date()}}}])
         const category1 = await CATEGORY.aggregate([{$match:{hasDiscount:false}}])
         console.log(category1)
        res.render('admin/pages-category-offer',{category,catOffer,category1})
    }else{
        res.redirect('/admin')
    }
})

//PRODUCT OFFER
router.get('/offer-product',async(req,res)=>{
    if(adminSession){
        const category = await CATEGORY.find({})
        const catOffer = await OFFERPRODUCT.aggregate([{$match:{expDate:{$gte:new Date()}}}])
        res.render('admin/pages-product-offer',{category,catOffer})
    }
})

//COUPON PAGE
router.get('/coupon',async(req,res)=>{
    if(adminSession){
        const coupon = await COUPON.aggregate([{$match:{expire:{$gte:new Date()}}}])
        res.render('admin/pages-coupon',{coupon})
    }
})

//DELETE CATEGORY OFFER
router.post('/offer-category/delete',async(req,res)=>{
    categoryOffer_HELPER.deleteCategoryOffer(req.body.offerId,req.body.categoryName).then(()=>{
        res.json({})
    })
})

//DELETE PRODUCT OFFER
router.post('/offer-product/delete',async(req,res)=>{
    categoryOffer_HELPER.deleteProductOffer(req.body.offerId).then(()=>{
        res.json({})
    })
})

//DELETE COUPON
router.post('/coupon/delete',(req,res)=>{
    categoryOffer_HELPER.deleteCoupon(req.body.couponId).then(()=>{
        res.json({})
    })
})

//ADD OFFER TO A PRODUCT
router.post('/product/add-offer', async(req,res)=>{
    console.log(req.body)
    categoryOffer_HELPER.addOfferToProduct(req.body.offerId,req.body.offerPercent,req.body.proId).then(()=>{
        res.json({})
    })
})

//PAGE TO ADD DYNAMIC BANNER
router.get('/banner',async(req,res)=>{
    if(adminSession){
        const title= await TITLE.findOne()
        res.render('admin/pages-banner',{title})
    }else{
        res.redirect('/admin')
    }
})

router.post('/banner/edit',async(req,res)=>{
    if(adminSession){
    try {
        await TITLE.updateOne({},{$set:{
            title1:req.body.title1,
            title2:req.body.title2,
            title3:req.body.title3,
        }})
        if(req.body.image1){
            let image1= req.body.image1
            let path1= './public/banner.jpg'
            let img1= image1.replace(/^data:([A-Za-z+/]+);base64,/,"")
            fs.writeFileSync(path1, img1, {encoding: 'base64'})
        }
        res.redirect('/admin/banner')
    } catch (error) {
        console.log(error)
        res.redirect('/admin/banner')
    }}else{
        re.redirect('/admin')
    }
    
})

//test
router.get('/test', async (req,res)=>{
    const data = await order_HELPER.getOrder()

    res.render('admin/pages-report_1',{data})
})

router.get('/offer', async (req,res)=>{
    const category = await CATEGORY.find({})
    const catOffer = await OFFERCATEGORY.aggregate([{$match:{expDate:{$gte:new Date()}}}])
   
    // console.log(noOfferCate)
    // console.log(catOffer)
    res.render('admin/pages-product-offer',{category,catOffer})
    // res.json({})
})

router.get('/test1',async(req,res)=>{
    const data = new TITLE({
        title1:"new Offer",
        title2:"ELECTRONICS",
        title3:"sales upto 20%"
    })

    const regdata = await data.save()
    console.log(regdata)
    
})

router.get('/test2',async(req,res)=>{
    const data = await TITLE.findOne({})
    console.log(data)
})
module.exports = router
