const express=require("express")
const cookieparser=require("cookie-parser")
const cors=require("cors")
const app=express();
// hm server bna yaha rhe
app.use(cors({
      origin:"http://localhost:5173",
      credentials:true,
}))
app.use(express.json())
app.use(cookieparser())
// reuqire all the routes here
const authrouter=require("./routes/auth.routes");
const interviewrouter=require("./routes/interview.routes")
// hm api/auth/.... likhege google pe to authrouter me jis router se match krega wo open hoga chahe get ho ya post api/auth prefix hai
app.use("/api/auth",authrouter)
app.use("/api/interview",interviewrouter)



module.exports=app