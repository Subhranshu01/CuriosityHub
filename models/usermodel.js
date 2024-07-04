const mongoose=require("mongoose")
const userschema=mongoose.Schema({
name:String,
user_name:String,
age:Number,
email:String,
password:String,
phone:String,
Bio:String,
dp:{
    type:String,
    default:"defaultdp.jpg"
},
post:[
    {type:mongoose.Schema.Types.ObjectId,ref:"post"}
]
})
module.exports=mongoose.model("usermodel",userschema)