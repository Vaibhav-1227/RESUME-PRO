// hmara server start yha ho rha hai
// dotenv me hm wo variable likhte hai jisko pure project me khi bhi use kr sakte hai
require("dotenv").config();
const app=require("./src/app")
const connectmongodb=require("./src/config/database");


connectmongodb();



const port=3000;
app.listen(port,()=>{
      console.log("server activated at port no 3000")
    
})
