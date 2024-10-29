import dotenv from "dotenv"
import connectDb from "./db/index.js"

import {app} from "./app.js"



dotenv.config({
    path:"./env"
})

connectDb()
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`server running at port ${process.env.PORT}`);        
    })

    app.on("errror",(error)=>{
     console.log("error",error);
     throw error;
    })
})
.catch((err)=>{
console.log("Error at MongoDB connnection",err);
})