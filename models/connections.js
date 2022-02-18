const mongoose = require('mongoose')

mongoose.connect('mongodb+srv://cluster0.pgmou.mongodb.net/project1',{
    useNewUrlParser:true,
    useUnifiedTopology:true
}).then(() =>{console.log('connected to DB(project1) successfully')})
  .catch((err) =>{
    console.log(err)
})
