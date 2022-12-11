const mongoose = require("mongoose");
const { Schema } = mongoose;

const UserSchema = new Schema({
  name: { type: String, required: true },
  userType: { type: String,enum:["p_owner","attendant"] },
  phone1:{type:Number,required:true, unique:true},
  phone2:{type:Number},
  isActive:{type:Boolean,default:true},
  email: { type: String },
  password: { type: String, required: true },
  
  date: {
    type: Date,
    default: Date.now,
  },
});
const User = mongoose.model("user", UserSchema);

module.exports = User;