const mongoose = require("mongoose");
const { Schema } = mongoose;

const VehicleOwnerSchema = new Schema({
  
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  date: {
    type: Date,
    default: Date.now,
  },
  phone1: { type: Number, required: true},
phone2: { type: Number},


  // vehicle_no: [{ type: String}],
//  allowed_credit: { type: Number, required: true},

 
});
const VehicleOwner = mongoose.model("vehicleOwner", VehicleOwnerSchema);

module.exports = VehicleOwner;