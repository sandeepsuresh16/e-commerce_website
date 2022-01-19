const Register = require('../models/register-user')
const PRODUCT = require('../models/register-product')
const CATEGORY = require('../models/register-category')
const CART =  require('../models/register-cart')
const ORDER = require('../models/register-order')
const ADDRESS = require('../models/register-address')
var ObjectId = require('mongoose').Types.ObjectId
const product_HELPER = require('../helpers/product-helper')
const cart_HELPER = require('../helpers/cart-helper')
const Razorpay = require('razorpay')
const { isDate } = require('util')
const { resolve } = require('path')
var instance = new Razorpay({
    key_id: 'rzp_test_Oe4RXp4rqB0h89',
    key_secret: 'j5OjiRPClGQ8KqvTjlVFjHYC',
  });

module.exports = {

    razorpayPayment: (orderId,total)=>{
        return new Promise((resolve,reject)=>{
            var options = {
                amount: total*100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: ""+orderId
              };
              instance.orders.create(options, function(err, order) {
                  if(err)
                    console.log(err)
                  else{
                    console.log(order);
                    resolve(order)
                  }
                  
                
              });
        })
    },

    verifyRazorpayPayment: (details)=>{
        console.log(details)
        return new Promise((resolve, reject)=>{
            const crypto = require('crypto')
            let hmac = crypto.createHmac('sha256', 'j5OjiRPClGQ8KqvTjlVFjHYC')
            hmac.update(details.payment.razorpay_order_id + "|" + details.payment.razorpay_payment_id)
            hmac = hmac.digest("hex")
            console.log(hmac)
            console.log(details.payment.razorpay_signature)
            if(hmac==details.payment.razorpay_signature){
              resolve()
            }else{
              reject()
            }
        })
    },

    changeOrderStatus:(orderId)=>{
      return new Promise(async(resolve,reject)=>{
        await ORDER.updateOne({_id:ObjectId(orderId)},{$set:{status:"placed"}})
        resolve()
      })
    },

    removeOrder:(orderId)=>{
      return new Promise(async(resolve, reject)=>{
        await ORDER.deleteOne({_id:ObjectId(orderId)})
        resolve()
      })
    },

    getOrder:()=>{
      return new Promise( async(resolve,reject)=>{
        const data = await ORDER.aggregate([{$match:{$and:[{'status':{$eq:'delivered'}},{'totalAmount':{$ne:0}}]}},
        {$project:{name:"$delivaryDetails.name",paymentMethod:1,status:1,totalAmount:1,date:1}}
        ])
        console.log(data)
        resolve(data)
      })
    },

    getOrderSorted: (type)=>{
      return new Promise(async(resolve, reject)=>{

        if(type=='year'){
          const year = new Date().getFullYear()
          const data = await ORDER.aggregate([{$match:{$and:[{'status':{$eq:'delivered'}},{'totalAmount':{$ne:0}}]}},
          {$project:{name:"$delivaryDetails.name",paymentMethod:1,status:1,totalAmount:1,date:1,year:{'$year':"$date"}}},
          {$match:{year:{$eq:year}}}
          ])
          resolve(data)
          console.log(data)
        }else if(type=='month'){
          let month = new Date().getMonth()
          month=month+1
          const data = await ORDER.aggregate([{$match:{$and:[{'status':{$eq:'delivered'}},{'totalAmount':{$ne:0}}]}},
          {$project:{name:"$delivaryDetails.name",paymentMethod:1,status:1,totalAmount:1,date:1,month:{'$month':"$date"}}},
          {$match:{month:{$eq:month}}}
          ])
          resolve(data)
          console.log(data)
        }else if(type == 'week'){
          const data = await ORDER.aggregate([{$match:{$and:[{date:{$gte:new Date(new Date()-7*60*60*24*1000)}},{'status':{$eq:'delivered'}},{'totalAmount':{$ne:0}}]}},
          {$project:{name:"$delivaryDetails.name",paymentMethod:1,status:1,totalAmount:1,date:1}}])
          resolve(data)
          console.log(data)
        }
      })
    },

    getOrderSortedRange:(from,to)=>{
      return new Promise(async(resolve,reject)=>{
        // const data = await ORDER.aggregate([{$match:{$and:[{date:{$gte:new Date(from)}},{date:{$lte:new Date(to)}}]}},
        const data = await ORDER.aggregate([{$match:{$and:[{date:{$lte:new Date(to)}},{date:{$gte:new Date(from)}},{'status':{$eq:'delivered'}},{'totalAmount':{$ne:0}}]}},
          {$project:{name:"$delivaryDetails.name",paymentMethod:1,status:1,totalAmount:1,date:1}}])
          resolve(data)
        console.log(data)
      })
    },

    getTodaysSale:()=>{
      date=new Date().toISOString()
      date=date.split('T')
      newdate=date[0]+'T00:00:00.000Z'
      return new Promise(async(resolve,reject)=>{
        const data = await ORDER.aggregate([{$match:{$and:[{date:{$gte:new Date(newdate)}},{status:{$ne:'cancelled'}},{totalAmount:{$ne:0}}]}},
      {$group:{_id:null,sum:{$sum:"$totalAmount"}}}])
        console.log(data)
        if(data.length==0)
          resolve(0)
        else{
            console.log(data[0].sum)
            resolve(data[0].sum)
          }
        
      })
    },
    
    getTodaysSaleCount:()=>{
      date=new Date().toISOString()
      date=date.split('T')
      newdate=date[0]+'T00:00:00.000Z'
      return new Promise(async(resolve,reject)=>{
        const data = await ORDER.aggregate([{$match:{$and:[{date:{$gte:new Date(newdate)}},{status:{$ne:'cancelled'}},{totalAmount:{$ne:0}}]}},
      {$count:'count'}])
      if(data.length==0){resolve(0)
      }else{
        console.log(data[0].count)
        resolve(data[0].count)
      }
        
      })
    },

    TodaysLatestSale:()=>{
      date=new Date().toISOString()
      date=date.split('T')
      newdate=date[0]+'T00:00:00.000Z'
      return new Promise(async(resolve,reject)=>{
        const data = await ORDER.aggregate([{$match:{$and:[{date:{$gte:new Date(newdate)}},{totalAmount:{$ne:0}}]}}])
      resolve(data)
      console.log(data)       
      })
    },

    getCustomerCount:()=>{
      return new Promise(async(resolve,reject)=>{
        const number =await Register.find({isUser:true}).count()
        console.log(number)
        resolve(number)
      })
    },

    getLatestOrders:()=>{
      return new Promise(async(resolve,reject)=>{
        const data = await ORDER.aggregate([{$sort:{date:-1}},{$project:{name:"$delivaryDetails.name",paymentMethod:1,status:1,totalAmount:1,date:1}},{$limit:10}])
      console.log(data)
      resolve(data)
      })
    },


    deleteAddress: (addressId,userId)=>{
      return new Promise(async(resolve,reject)=>{
        await ADDRESS.deleteOne({_id:ObjectId(addressId)})
        resolve()
      })
    },

    editAddress:(details)=>{
      return new Promise(async(resolve,reject)=>{
        await ADDRESS.updateOne({_id:ObjectId(details.addressId)},{$set:{"details.name":details.name,'details.address':details.address,'details.phone':details.phone,'details.pin':details.pin}})
        resolve()
      })
    },

    addAddress:(details,userId)=>{
      return new Promise(async(resolve,reject)=>{
        addressObj={
          name:details.name,
          address:details.address,
          phone:details.phone,
          pin:details.pin
      }
      let newAddress = new ADDRESS({
          user:ObjectId(userId),
          date:new Date(),
          details:addressObj
      })
      let addressReg = await newAddress.save()
      resolve()
      // console
      })
    },

    topSellingProducts:()=>{
      return new Promise(async(resolve, reject)=>{
        const data = await ORDER.aggregate([
        {$match:{status:{$ne:"cancelled"},'products.item':{$ne:'null'}}},
        {$unwind:"$products"},
        {$group:{_id:"$products.item",sales:{$sum:"$products.quantity"}}},
        {$match:{_id:{$ne:null}}},
        {$sort:{sales:-1}},
        {$limit:5},{$project:{_id:{"$toObjectId": "$_id"},sales:1}},
        {$lookup:{
          from:'products',
          localField:"_id",
          foreignField:'_id',
          as:'product'
        }},
        {$project:{sales:1,product:{$arrayElemAt:['$product',0]}}}
      ])
        console.log(data)
        resolve(data)
      })
    },


    salesCount:()=>{
      return new Promise(async(resolve, reject)=>{
       let data = await ORDER.aggregate([{$match:{$and:[{date:{$gte:new Date(new Date()-7*60*60*24*1000)}},{status:{$ne:'cancelled'}}]}},
       {$project:{date:1,user:1}},
       {$project:{day:{$dayOfYear:'$date'}}},
       {$group:{_id:"$day",sales:{$sum:1}}},
       {$sort:{_id:1}}
       ])
       console.log(data)
       data1=[]
       for(i=1;i<=7;i++){
         data1.push(data[i].sales)
       }
       resolve(data1)
       console.log(data1)
      })
    },

    getWeeklyCancelledOrder:()=>{
      return new Promise(async(resolve, reject)=>{
      const data=await ORDER.aggregate([{$match:{status:'cancelled',date:{$gte:new Date(new Date()-7*60*60*24*1000)}}},{$count:'count'}])
        if(data.length==0)
          resolve(0)
        else
          resolve(data[0].count)
        console.log(data[0].count)
      })
    },

    getWeeklyShippedOrder:()=>{
      return new Promise(async(resolve, reject)=>{
      const data=await ORDER.aggregate([{$match:{status:'shipped',date:{$gte:new Date(new Date()-7*60*60*24*1000)}}},{$count:'count'}])
        if(data.length==0)
          resolve(0)
        else
          resolve(data[0].count)
      })
    },

    getWeeklyPlacedOrder:()=>{
      return new Promise(async(resolve, reject)=>{
      const data=await ORDER.aggregate([{$match:{status:'placed',date:{$gte:new Date(new Date()-7*60*60*24*1000)}}},{$count:'count'}])
        if(data.length==0)
          resolve(0)
        else
          resolve(data[0].count)
      })
    },

    getWeeklyDeliveredOrder:()=>{
      return new Promise(async(resolve, reject)=>{
      const data=await ORDER.aggregate([{$match:{status:'delivered',date:{$gte:new Date(new Date()-7*60*60*24*1000)}}},{$count:'count'}])
        if(data.length==0)
          resolve(0)
        else
          resolve(data[0].count)
      })
    },



    getWeeklySalesNumber: async () => {
      const dayOfYear = (date) =>
          Math.floor(
              (date - new Date(date.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24
          )
      return new Promise(async (resolve, reject) => {
          const data = await ORDER.aggregate([
              {
                  $match: {
                      $and: [{ status: { $ne: 'cancelled' } }],
                      date: { $gte: new Date(new Date() - 7 * 60 * 60 * 24 * 1000) },
                  },
              },

              { $group: { _id: { $dayOfYear: '$date' }, count: { $sum: 1 } } },
          ])
          console.log(data)
          const thisday = dayOfYear(new Date())
          let salesOfLastWeekData = []
          for (let i = 0; i < 8; i++) {
              let count = data.find((d) => d._id === thisday + i - 7)

              if (count) {
                  salesOfLastWeekData.push(count.count)
              } else {
                  salesOfLastWeekData.push(0)
              }
          }
          resolve(salesOfLastWeekData)
          console.log(salesOfLastWeekData)

      })
    },

    getWeeklySales: async () => {
      const dayOfYear = (date) =>
          Math.floor(
              (date - new Date(date.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24
          )
      return new Promise(async (resolve, reject) => {
          const data = await ORDER.aggregate([
              {
                  $match: {
                      $and: [{ status: { $ne: 'cancelled' } }],
                      date: { $gte: new Date(new Date() - 7 * 60 * 60 * 24 * 1000) },
                  },
              },

              { $group: { _id: { $dayOfYear: '$date' }, count: { $sum: '$totalAmount' } } },
          ])
          console.log(data)
          const thisday = dayOfYear(new Date())
          let salesOfLastWeekData = []
          for (let i = 0; i < 8; i++) {
              let count = data.find((d) => d._id === thisday + i - 7)

              if (count) {
                  salesOfLastWeekData.push(count.count)
              } else {
                  salesOfLastWeekData.push(0)
              }
          }
          resolve(salesOfLastWeekData)
          console.log(salesOfLastWeekData)

      })
    },

    getBestSellingProducts:()=>{
      return new Promise(async(resolve, reject)=>{
          const data = await ORDER.aggregate([{$match:{"status":{$ne:"cancelled"}}},
          {$unwind:"$products"},
          {$group:{_id:"$products.item",count:{$sum:"$products.quantity"}}},
          {$project:{_id:{"$toObjectId": "$_id"},count:1}},
          {$lookup:{from:"products",localField:"_id",foreignField:"_id",as:"product"}},
          {$project:{_id:1,count:1,product:{$arrayElemAt:['$product',0]}}},
          {$match:{'product.isActive':true}},
          {$match:{_id:{$ne:null}}},
          {$sort:{count:-1}},
          {$limit:6}])
          resolve(data)
      })
  }





}   