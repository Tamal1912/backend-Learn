import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


const videoSchema=Schema({

videoFile:{
    type:String,      //* cloudinary url
    required:true
},
thumbnail:{
    type:String,      //* cloudinary url
    required:true
},
title:{
    type:String,      
    required:true
},
description:{
    type:String,    
    required:true
},
duration:{
    type:Number,      //* cloudinary url
    required:true
},
views:{
    type:String,
    required:true
},
videoFile:{
    type:String,      //* cloudinary url
    required:true
},
isPublished:{
    type:String,      
    required:true
},
owner:{
    type:Schema.Types.ObjectId,
    ref:"User"
}

},{timestamps:true});

videoSchema.plugin(mongooseAggregatePaginate)

export const Video=mongoose.model("Video",videoModel)