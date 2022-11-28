const mongoose = require("mongoose");
const { Schema } = mongoose;

const LiveCreditSchema = new Schema({
    vehicle_owner:{type: mongoose.Schema.Types.ObjectId,
      ref: 'vehicleOwner'},
  allowed_credit: { type: Number, required: true},
  utilized_credit: { type: Number, required: true},

  available_credit: { type: Number, required: true}


  
});
const LiveCredit = mongoose.model("livecredit", LiveCreditSchema);

module.exports = LiveCredit;