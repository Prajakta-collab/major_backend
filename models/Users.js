const mongoose = require("mongoose");
const { Schema } = mongoose;

const UserSchema = new Schema({
  name: { type: String, required: true },
  userType: { type: String, required: true,enum:["p_owner","attendant"] },
  phone:{type:Number,required:true, unique:true},
  email: { type: String, required: true },
  password: { type: String, required: true },
  date: {
    type: Date,
    default: Date.now,
  },
});
const User = mongoose.model("user", UserSchema);

module.exports = User;