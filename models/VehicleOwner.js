const mongoose = require("mongoose");
const { Schema } = mongoose;

const VehicleOwnerSchema = new Schema({
  name: { type: String, required: true },
  phone1: { type: Number, required: true},
phone2: { type: Number},


  vehicle_no: [{ type: String}],
//  allowed_credit: { type: Number, required: true},

 
});
const VehicleOwner = mongoose.model("vehicleOwner", VehicleOwnerSchema);

module.exports = VehicleOwner;