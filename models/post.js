const mongoose=require("mongoose")
const postschema=mongoose.Schema({
user:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"usermodel"
},
title:String,
content:String,
date:{
    type:Date,
    default:Date.now
},
likes:[{
type:mongoose.Schema.Types.ObjectId,ref:"usermodel"
}]
})
module.exports=mongoose.model("post",postschema)