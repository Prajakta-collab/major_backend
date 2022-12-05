const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");
const VehicleOwner = require("../models/VehicleOwner");

const { body, validationResult } = require("express-validator");
const LiveCredit = require("../models/LiveCredit");
const generateUniqueId = require("generate-unique-id");
const fetchvowner = require("../middleware/fetchvowner");

//Router 1: Raising fuel request for vehicle owner : login required

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

    if (req.body.debit < userCredit.available_credit) {
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

//Router 2: get all pending fuel requests : pump attendant

router.get("/getallreq", async (req, res) => {
  try {
    const requests = await Transaction.find({ status: "req_received" });

    // console.log(requests);
    res.status(200).json(requests);
  } catch (error) {
    //console.error(error.message);
    res.status(500).send("Internal Server Error !");
  }
});

// Router 3: get all daily Transactions : login required
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

// Router 4: Complete fuel req (id) : pump attendant
router.put("/completereq/:id", async (req, res) => {
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

//Router 5: get all cards details : pump owner dashboard cards
router.get("/getcarddetails", async (req, res) => {
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

    res
      .status(200)
      .json({
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

//Router 6: get all transactions for particular customer (vehicle owner) : pump owner login required

router.get("/getalltr/:id", async (req, res) => {
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

//Router 7: get all card details on attendant dashboard .i.e completed requests, total requests, pending requests : attendant login required
router.get("/getreqdata", async (req, res) => {
  try {
    const pending = await Transaction.find({
      status:'req_received'
    }).count();

    const completed=await Transaction.find({status:'delivered'}).count();
    const total=await Transaction.find().count();


   
    res.status(200).json({total_req:total,pending_req:pending, completed_req:completed});
  } catch (error) {
    //console.error(error.message);
    res.status(500).send("Internal Server Error !");
  }
});


//Router 8: get all transaction histroy for all cusotmers : pump o login required
router.get("/getalltransactions", async (req, res) => {
  try {
    const transactions = await Transaction.find();

    console.log(transactions);
    res.status(200).json(transactions);
  } catch (error) {
    //console.error(error.message);
    res.status(500).send("Internal Server Error !");
  }
});

//Router : get own transacions history : vehicle_owner login required

router.get("/getalltr", async (req, res) => {
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

module.exports = router;
