const mongoose = require("mongoose");
const { Schema } = mongoose;

const VehicleOwnerSchema = new Schema({
  
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  isActive:{type:Boolean,default:true},
  date: {
    type: Date,
    default: Date.now,
  },
  phone1: { type: Number, required: true, unique:true},
phone2: { type: Number},

});
const VehicleOwner = mongoose.model("vehicleOwner", VehicleOwnerSchema);

module.exports = VehicleOwner;