// multer is used to handle pdf data and here we 
// jo data hoga usko file me dalege
const multer=require("multer")
const upload=multer({
      storage:multer.memoryStorage(),
      limits:{
           fileSize: 3*1024*1024,
      }
})

module.exports=upload