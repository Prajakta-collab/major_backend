const mongoose = require("mongoose");
const { Schema } = mongoose;

const VehicleSchema = new Schema({
  vehicle_no: { type: String, required: true },
  vehicle_type: { type: String, required: true },
  ownership:[
    {type: Schema.Types.ObjectId, ref: 'vehicleOwner'}
  ]
});
const Vehicle = mongoose.model("vehicle", VehicleSchema);

module.exports = Vehicle;