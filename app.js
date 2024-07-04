const express = require("express")
const app = express()
const path = require("path")
app.use(express.static(path.join(__dirname, "public", "styles")))
app.use(express.static(path.join(__dirname, "public", "images")))
app.use(express.static(path.join(__dirname, "public", "images","usersdp")))
app.use(express.static(path.join(__dirname, "public")))
const bcrypt = require("bcrypt")

const mongoose = require("mongoose")
const usermodel = require("./models/usermodel")
const post = require("./models/post")
var jwt = require('jsonwebtoken');
const cookieParser = require("cookie-parser")
app.set("view engine", "ejs")
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
const multer=require("multer")
const { log } = require("console")
const { ObjectId } = require('mongodb');
mongoose.connect('mongodb://localhost:27017/project');


const upload = multer();

app.get("/", isloggedin, async (req, res) => {
  const userdata = await usermodel.findOne({ user_name: req.user.user_name })
  const postdata = await post.find().populate("user")

  res.render("home", { userdata: userdata, postdata: postdata })
})
app.get("/register", (req, res) => {
  res.render("register")
})
app.post("/register", async (req, res) => {
  const { name, user_name, age, email, password } = req.body

  const flag = await usermodel.findOne({ user_name: user_name })
  if (flag) {
    return res.send("user Already exits")
  }
  const hashedPassword = await bcrypt.hash(password, 10)
  await usermodel.create({
    name: name,
    user_name: user_name,
    age: age,
    email: email,
    password: hashedPassword
  })

  res.redirect("/login")
})

app.get("/login", (req, res) => {
  res.render("login")
})
app.post("/login", async (req, res) => {
  const { user_name, password } = req.body
  const flag = await usermodel.findOne({ user_name: user_name })
  if (!flag) {
    return res.send("user not exists")
  }
  bcrypt.compare(password, flag.password, (err, result) => {
    if (result) {
      var token = jwt.sign({ user_name: user_name, email: flag.email, user_id: flag._id }, 'shhhhh');
      res.cookie("token", token)
      res.redirect("/")
    }
    else {
      res.send("invalid credentails")
    }
  })


})


app.get("/logout", (req, res) => {
  res.cookie("token", "")
  res.redirect("/")
})

app.get("/profile", isloggedin, async (req, res) => {
  const userdata = await usermodel.findOne({ user_name: req.user.user_name }).populate("post")

  res.render("profile", { userdata: userdata })
})
function isloggedin(req, res, next) {

  if (req.cookies.token) {
    let decode = jwt.verify(req.cookies.token, "shhhhh")
    req.user = decode
    next()
  }

  else {
    res.redirect("/login")
  }
}
app.get("/setphone", isloggedin, async (req, res) => {
  res.render("editphone")
})
app.post("/editphone", isloggedin, async (req, res) => {
  await usermodel.findOneAndUpdate({ user_name: req.user.user_name }, { phone: req.body.phone }, { new: true })
  res.redirect("/profile")
})
app.get("/editbio", (req, res) => {
  res.render("editbio")
})
app.post("/editbio", isloggedin, async (req, res) => {
  await usermodel.findOneAndUpdate({ user_name: req.user.user_name }, { Bio: req.body.bio }, { new: true })
  res.redirect("/profile")
})
app.post("/post", isloggedin, async (req, res) => {
  let user = await usermodel.findOne({ user_name: req.user.user_name })
  let postdata = await post.create({ user: user._id, title: req.body.title, content: req.body.content })
  user.post.push(postdata._id)
  await user.save();
  res.redirect("/")
})

app.get("/likes/:id", isloggedin, async (req, res) => {
 
  let postdata = await post.findOne({ _id: req.params.id }).populate("user")
  if (await postdata.likes.indexOf(req.user.user_id) === -1) {
    await postdata.likes.push(req.user.user_id)
  }
  else {
    postdata.likes.splice(postdata.likes.indexOf(req.user.user_id), 1)
  }
  await postdata.save()

  res.redirect("/")
})
app.get("/del/:postid", isloggedin, async (req, res) => {

  usermodel.updateOne(
    { _id: req.user.user_id },
    { $pull: { post: req.params.postid } }
  )
  await post.findOneAndDelete({ _id: req.params.postid })

  res.redirect("/profile")
})
app.get("/profile/:id",isloggedin,async (req,res)=>{
  
 if(req.user.user_id===req.params.id){
  res.redirect("/profile")
 }
 else{
 
 
  const userdata = await usermodel.findOne({ _id:req.params.id}).populate("post")
 
 
  res.render("otheruserprofile",{userdata:userdata})
 }
})
app.get("/editpost/:postid",async (req,res)=>{
  let postdata = await post.findOne({ _id: req.params.postid })
  res.render("editpost",{postdata:postdata})
})
app.post("/editpost/:postid",async (req,res)=>{
   let postdata = await post.findOneAndUpdate({ _id: req.params.postid },{title:req.body.title,content:req.body.content})
   res.redirect("/profile")
 
})
app.get("/uploaddp",(req,res)=>{
  res.render("setdp")
})


app.post('/uploaddp', isloggedin, (req, res, next) => {
  // Create a custom storage configuration
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/images/usersdp');
    },
    filename: function (req, file, cb) {
      
      const fn = req.user.user_name + path.extname(file.originalname);
      cb(null, fn);
    }
  });

  // Reinitialize multer with the custom storage configuration
  const upload = multer({ storage: storage }).single('dp');

  // Call the upload middleware
  upload(req, res, async function (err) {
    if (err) {
      return res.status(500).send('File upload failed');
    }
    // File upload successful, handle further processing if needed
    const userdata= await usermodel.findOneAndUpdate({_id:req.user.user_id},{dp:`${req.user.user_name}${path.extname(req.file.originalname)}`})
   
    await userdata.save();
    res.redirect('/profile');
  });
});

app.get("/post/wholiked/:postid",async (req,res)=>{
let data=await post.findOne({_id:req.params.postid}).populate("likes")
res.render("user_who_liked",{data:data})

})


app.get("/post/wholiked/profile/:id",isloggedin,async (req,res)=>{
  
  if(req.user.user_id===req.params.id){
   res.redirect("/profile")
  }
  else{
  
  
   const userdata = await usermodel.findOne({ _id:req.params.id}).populate("post")
  
  
   res.render("otheruserprofile",{userdata:userdata})
  }
 })
app.listen(3000)
