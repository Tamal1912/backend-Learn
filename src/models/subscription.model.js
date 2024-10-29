import mongoose from "mongoose"

const subcriptionSchema=mongoose.Schema({
    subscriber:{
        type:mongoose.Schema.Types.ObjectId, //* one who subcribes
        ref:"User"
    },
    channel:{
        type:mongoose.Schema.Types.ObjectId, //* one to whom "subcriber" are subcribing 
        ref:"User"
    }
},
{
    timestamps:true
}
)

export const Subcription=mongoose.Model("Subcription",subcriptionSchema);

