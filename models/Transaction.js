const mongoose = require("mongoose");
const { Schema } = mongoose;

const TransactionSchema = new Schema({

  transaction_no: { type: String, unique: true },
  vehicle_owner: { type: mongoose.Schema.Types.ObjectId, ref: "vehicleOwner" },
  vehicle_no: { type: String, default: "-" },

  particulars: { type: String },
  reference: { type: String },
  debit: { type: Number, required: true, default: 0 },
  credit: { type: Number, default: 0 },
  amount_due: { type: Number },

  status: {
    type: String,
    required: true,
    enum: ["req_received", "pay_received", "inprocess", "delivered"],
  },
  qrimg: { type: String, contentType: String },

  tr_date: {
    type: Date,
    default: Date.now,
  },
  delivered_date: { type: Date, default: Date.now },
});
const Transaction = mongoose.model("transaction", TransactionSchema);

module.exports = Transaction;
