import {User} from "../models/user.model.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken"
import {ApiError} from "../utils/ApiError.js"



     const verifyJWT=asyncHandler(async(req,_,next)=>{ //* "_" means res parametar have work to do
        
        try { //*accessing the token on the cookies
        const token= req.cookies?.accessToken || req.header(
            "Authorization".replace("Bearer","")
        )
    
        if(!token){
            throw new ApiError(401,"Unauthorized Request")
        }
    
        //* decoding token
    
        const decodedToken= jwt.verify(token,process.env.ACCESS_TOKEN,);
    
        const user= await User.findById(decodedToken?._id).select(
            "-password -refreshToken"
        )
    
        req.user=user;
        
        next();
    }
    catch (error) {
        throw new ApiError(401,"Invalid Request");
        }
        }
) 
        

export default verifyJWT
