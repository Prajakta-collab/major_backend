const mongoose = require("mongoose");
const { Schema } = mongoose;

const TransactionSchema = new Schema({
  transaction_no: { type: String },
  // vehicle_no:[
  //   {type: Schema.Types.ObjectId, ref: 'vehicle'}
  // ],
  vehicle_no:{type:String, required: true},

  particulars: { type: String, required: true },
  reference: { type: String},
  debit: { type: Number, required: true },
  credit: { type: Number, required: true },
  amount_due: { type: Number, required: true },


  status: { type: String, required: true,enum:["req_received","pay_received","inprocess","delivered"] },

  tr_date: {
    type: Date,
    default: Date.now,
  },
  delivered_date:{  type: Date,
    default: Date.now,}
  
});
const Transaction = mongoose.model("transaction", TransactionSchema);

module.exports = Transaction;