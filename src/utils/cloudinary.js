import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const uploadOnCloudinary= async (localFilePath)=>{
   try {
    //*if no local file

    if(!localFilePath) return null;

    //*upload the file on cloudinary

    const response=await cloudinary.uploader.upload(localFilePath,{
        resource_type:"auto"
    })

    //console.log("File Uploaded Succesfully",response.url);
    fs.unlinkSync(localFilePath) 

    return response
    
    
   } catch (error) {
    
    //*remove the locally saved file from the local Storage

    fs.unlinkSync(localFilePath)
    return null;
   }
}

export default uploadOnCloudinary