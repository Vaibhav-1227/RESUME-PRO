const mongoose =require("mongoose")


const blocktokenchema=new mongoose.Schema({
      token:{
            type:String,
            required:true,
      }
})

const tokenblacklistmodel=mongoose.model("bloclisttokens",blocktokenchema);
module.exports=tokenblacklistmodel