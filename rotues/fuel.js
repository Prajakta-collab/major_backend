const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");
const VehicleOwner = require("../models/VehicleOwner");

const { body, validationResult } = require("express-validator");
const LiveCredit = require("../models/LiveCredit");
const generateUniqueId = require("generate-unique-id");
const fetchvowner = require("../middleware/fetchvowner");
const fetchatt = require("../middleware/fetchatt");
const fetchpowner = require("../middleware/fetchpowner");
var moment = require("moment");

//Router 1: Raising fuel request for vehicle owner : vehicle login required

router.post("/addreq", fetchvowner, async (req, res) => {
  // console.log("req.body",req)

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // console.log("req.user.id", req.user.user.id);
    const userCredit = await LiveCredit.findOne({ vehicle_owner: req.user.id });

    // console.log("userCredit", userCredit);

    //if req.body.debit <= userCredit.available_credit then raising req is fine

    if (req.body.debit <= userCredit.available_credit) {
      const id = generateUniqueId();

      // console.log("id",id)

      let savedreq = await Transaction.create({
        transaction_no: id,
        vehicle_owner: req.user.id,
        vehicle_no: req.body.vehicle_no,
        particulars: req.body.particulars,
        reference: req.body.reference,
        debit: req.body.debit,
        credit: req.body.credit,
        amount_due: req.body.amount_due,
        status: "req_received",
      });

      res.status(200).send("Request sent Successfullly");
    } else {
      res.status(500).send("Your Credit is not enough");
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error !");
  }
});

//Router 2: get all pending fuel requests : pump attendant login required

router.get("/getallreq", fetchatt, async (req, res) => {
  try {
    const requests = await Transaction.find({
      status: "req_received",
    }).populate("vehicle_owner");

    // console.log(requests);
    res.status(200).json(requests);
  } catch (error) {
    //console.error(error.message);
    res.status(500).send("Internal Server Error !");
  }
});

//Router 3: search pending fuel request with vehicle_no : attendant login required
router.post("/searchreq", fetchatt, async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    let success;
    const request = await Transaction.findOne({
      status: "req_received",
      vehicle_no: req.body.vehicle_no,
    });
    if (request) {
      success = true;
    }

    res.status(200).json({ success, request });
  } catch (error) {
    console.log("error", error);
    res.status(500).send("Internal Server Error !");
  }
});

// Router 4: get all daily Transactions : login required
router.get("/getdailytr", async (req, res) => {
  try {
    //finding transactions between 12am to current time of same day
    const transactions = await Transaction.find({
      $and: [
        { tr_date: { $gte: new Date().setUTCHours(0, 0, 0, 0) } },
        { tr_date: { $lt: new Date(Date.now()) } },
      ],
    });

    // console.log(transactions);
    res.status(200).json(transactions);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error !");
  }
});

// Router 5: Complete fuel req (id) : pump attendant login required
router.put("/completereq/:id", fetchatt, async (req, res) => {
  try {
    // Create a newTransaction object
    const newTransaction = {};
    newTransaction.status = "delivered";
    newTransaction.delivered_date = Date.now();

    // Find the transaction to be updated and update it
    let transactionnew = await Transaction.findById(req.params.id);
    // console.log("new transaction", transactionnew);

    if (!transactionnew) {
      return res.status(404).send("Not Found");
    }
    let savedcredit;

    if (transactionnew) {
      //find live credit of that customer to be updated
      let cust_credit = await LiveCredit.findOne({
        vehicle_owner: transactionnew.vehicle_owner,
      });
      const newCredit = {};

      //allowed_credit as it is
      //utilized_credit = utilized_credit+ transactionnew.debit
      //avaialble_credit= available_credit-transactionnew.debit

      newCredit.utilized_credit =
        cust_credit.utilized_credit + transactionnew.debit;
      newCredit.available_credit =
        cust_credit.available_credit - transactionnew.debit;

      //update live credit of that customer

      savedcredit = await LiveCredit.findByIdAndUpdate(
        cust_credit._id,
        { $set: newCredit },
        { new: true }
      );

      newTransaction.amount_due = savedcredit.utilized_credit;
      newTransaction.credit = savedcredit.allowed_credit;

      tr = await Transaction.findByIdAndUpdate(
        req.params.id,
        { $set: newTransaction },
        { new: true }
      );
    }

    res.status(200).send("Request completed successfully !");
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error !");
  }
});

//Router 6: get all cards details : pump owner dashboard cards :pumpo login required
router.get("/getcarddetails", fetchpowner, async (req, res) => {
  try {
    const requests = await VehicleOwner.find().count();
    const sales = await Transaction.aggregate([
      {
        $group: {
          _id: null,
          totalValue: {
            $sum: "$amount_due",
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const vehicles = await Transaction.find({ status: "delivered" }).count();
    const totalCredit = await LiveCredit.aggregate([
      {
        $group: {
          _id: null,
          totalValue: {
            $sum: "$allowed_credit",
          },
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      customers: requests,
      sales: sales[0].totalValue,
      vehicles: vehicles,
      credit: totalCredit[0].totalValue,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error !");
  }
});

//Router 7: get all transactions for particular customer (vehicle owner) : pump owner login required

router.get("/getalltr/:id", fetchpowner, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      vehicle_owner: req.params.id,
    });

    // console.log(transactions);
    res.status(200).json(transactions);
  } catch (error) {
    //console.error(error.message);
    res.status(500).send("Internal Server Error !");
  }
});

//Router 8: get all card details on attendant dashboard .i.e completed requests, total requests, pending requests : attendant login required
router.get("/getreqdata", fetchatt, async (req, res) => {
  try {
    const pending = await Transaction.find({
      status: "req_received",
    }).count();

    const completed = await Transaction.find({ status: "delivered" }).count();
    const total = await Transaction.find().count();

    res
      .status(200)
      .json({
        total_req: total,
        pending_req: pending,
        completed_req: completed,
      });
  } catch (error) {
    //console.error(error.message);
    res.status(500).send("Internal Server Error !");
  }
});

//Router 9: get all transaction histroy for all cusotmers : pump o login required
router.get("/getalltransactions", fetchpowner, async (req, res) => {
  try {
    const transactions = await Transaction.find().populate('vehicle_owner');

    console.log(transactions);
    res.status(200).json(transactions);
  } catch (error) {
    //console.error(error.message);
    res.status(500).send("Internal Server Error !");
  }
});

//Router 10: get own transacions history : vehicle_owner login required

router.get("/getalltr", fetchvowner, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      vehicle_owner: req.user.id,
    });

    // console.log(transactions);
    res.status(200).json(transactions);
  } catch (error) {
    //console.error(error.message);
    res.status(500).send("Internal Server Error !");
  }
});

//Router 11: search in all transactions with vehicle_owner name : pump owner login required
router.post("/searchbyname", fetchpowner, async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const cust = await VehicleOwner.findOne({ name: req.body.name });
    const transactions = await Transaction.find({
      vehicle_owner: cust._id,
    });

    // console.log(transactions);
    res.status(200).json(transactions);
  } catch (error) {
    //console.error(error.message);
    res.status(500).send("Internal Server Error !");
  }
});

//Router 12: filter all user transactions by duration - daily, last 7 days, last one month , YTD (year till date) : pump owner login required
router.post("/filteralltr", fetchpowner, async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  let transactions;
  try {
    if (req.body.duration === "daily") {
      transactions = await Transaction.find({
        $and: [
          { tr_date: { $gte: new Date().setUTCHours(0, 0, 0, 0) } },
          { tr_date: { $lt: new Date(Date.now()) } },
        ],
      });
    } else if (req.body.duration === "weekly") {
      var d = new Date();
      d.setDate(d.getDate() - 7);
      transactions = await Transaction.aggregate([
        { $match: { tr_date: { $gt: d } } },
      ]);
    } else if (req.body.duration === "month") {
      var d = new Date();
      d.setDate(d.getDate() - 30);
      transactions = await Transaction.aggregate([
        { $match: { tr_date: { $gt: d } } },
      ]);
    } else if (req.body.duration === "year") {
      var d = new Date();
      d.setDate(d.getDate() - 365);
      transactions = await Transaction.aggregate([
        { $match: { tr_date: { $gt: d } } },
      ]);
    }

    // console.log(transactions);
    res.status(200).json(transactions);
  } catch (error) {
    //console.error(error.message);
    res.status(500).send("Internal Server Error !");
  }
});

//Router 13: filter own transactions by duration - daily, last 7 days, last one month , YTD (year till date) : vehicle owner login required
router.post("/filterowntr", fetchvowner, async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  let transactions;
  var d = new Date();
  try {
    if (req.body.duration === "daily") {
      transactions = await Transaction.find({
        vehicle_owner: req.user.id,
        $and: [
          { tr_date: { $gte: new Date().setUTCHours(0, 0, 0, 0) } },
          { tr_date: { $lt: new Date(Date.now()) } },
        ],
      });
    } else if (req.body.duration === "weekly") {
      d.setDate(d.getDate() - 7);
      transactions = await Transaction.find({
        vehicle_owner: req.user.id,
        $and: [{ tr_date: { $gte: d } }],
      });
    } else if (req.body.duration === "month") {
      d.setDate(d.getDate() - 30);
      transactions = await Transaction.find({
        vehicle_owner: req.user.id,
        $and: [{ tr_date: { $gte: d } }],
      });
    } else if (req.body.duration === "year") {
      d.setDate(d.getDate() - 365);
      transactions = await Transaction.find({
        vehicle_owner: req.user.id,
        $and: [{ tr_date: { $gte: d } }],
      });
    }

    // console.log(transactions);
    res.status(200).json(transactions);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error !");
  }
});
module.exports = router;
