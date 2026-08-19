const mongoose=require("mongoose")
// create a schema and converted into model
const userschema=new mongoose.Schema({
      username:{
            type:String,
            unique:[true,"useralready found"],
            required:true,
      },
      password:{
            type:String,
            required:true,
      },
      email:{
            type:String,
            unique:[true,"email already found"],
            required:true,
      }
})
// sbhi users ka requirement userschema me hai aur model bn rha
const usermodel=mongoose.model("users",userschema);
module.exports=usermodel