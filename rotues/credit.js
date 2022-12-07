const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");
const VehicleOwner = require("../models/VehicleOwner");

const { body, validationResult } = require("express-validator");
const expressAsyncHandler = require("express-async-handler");
const LiveCredit = require("../models/LiveCredit");
const fetchvowner = require("../middleware/fetchvowner");
const fetchpowner = require("../middleware/fetchpowner");

//router 1: to get credits for the current logged in vehicle owner : vehicle owner login required
router.get("/fetchcredit", fetchvowner, async (req, res) => {
  try {
    // console.log(req.user.id);
    let credits = await LiveCredit.findOne({ vehicle_owner: req.user.id });
    // console.log(credits);

    return res.status(200).json(credits);
  } catch (error) {
    console.error(error.message);
    return res.status(500).send("Internal Server Error !");
  }
});

//Router 2: get credits of all customers :pump owner login required
router.get("/fetchallcredits", fetchpowner, async (req, res) => {
  try {
    // console.log(req.user.id);
    let credits = await LiveCredit.find().populate("vehicle_owner");
    // console.log(credits);

    return res.status(200).json(credits);
  } catch (error) {
    console.error(error.message);
    return res.status(500).send("Internal Server Error !");
  }
});

//Router 3: renew credit of particular customer : pump owner login required
router.put("/renew/:id", fetchpowner, async (req, res) => {
  try {
    //allowed_credit =utilized_credit
    //utlized_credit=0

    const credit = await LiveCredit.findOne({ vehicle_owner: req.params.id });
    console.log("credit",credit)
    let updated;

    if (credit.available_credit===0) {
      let newCredit = {};
      newCredit.allowed_credit = credit.allowed_credit;
      newCredit.utilized_credit = 0;
      newCredit.available_credit = newCredit.allowed_credit;

      updated = await LiveCredit.findOneAndUpdate(
        { vehicle_owner: req.params.id },
        { $set: newCredit },
        { new: true }
      );
      res.status(200).json(updated);
    } else {
      return res.status(400).send("This user still has some credit remained !");
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error !");
  }
});

module.exports = router;
