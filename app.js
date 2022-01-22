const express =  require("express")
const path = require('path')
const app=express()
require('./models/connections')
const Register = require('./models/register-user');
const adminRoute = require('./routes/adminRoute')
const userRoute = require('./routes/userRoute')
const sessions = require('express-session')
const cookieParser = require('cookie-parser');
const PRODUCT = require('./models/register-product')
const fileUpload = require('express-fileupload')


app.use(fileUpload())
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(sessions({
    secret: "this is my key",
    saveUninitialized: true,
    resave: false,
    cookie: { maxAge: 3600000 }
}))


app.use(function (req, res, next) {
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    next();
});

app.set('view engine','ejs')
app.use(express.static('public'))
app.use('/admin',adminRoute)
app.use('/',userRoute)


app.use((req,res)=>{
    res.status(404).render('user/404')
})

app.listen(3000,()=>{
    console.log('server listening @PORT:3000');
})







