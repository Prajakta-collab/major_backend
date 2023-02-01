const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");
const VehicleOwner = require("../models/VehicleOwner");
const generateUniqueId = require("generate-unique-id");
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
    console.log(credits);

    return res.status(200).json(credits);
  } catch (error) {
    console.error(error.message);
    return res.status(500).send("Internal Server Error !");
  }
});

//Router 3: payment for particular customer -> update credit: pump owner login required
router.post("/payment/:id", fetchpowner, async (req, res) => {
  const errors = validationResult(req);

  console.log("req.body",req.body)
  console.log("type of credit",typeof(req.body.credit))

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
   
    const credit = await LiveCredit.findOne({ vehicle_owner: req.params.id }).populate("vehicle_owner");
   

    if(credit.vehicle_owner.isActive===false){
      return res.status(400).send("This user is not active");
    }

    let updated;
    const id = generateUniqueId();

    //logic
    //utilized_credit = utilized_credit-req.body.credit
    //available_credit=available_credit+req.body.credit
    let newCredit = {};
    //when available credit has become 0 for this customer 
    if(credit.available_credit===0){
      newCredit.allowed_credit=req.body.credit;
      newCredit.utilized_credit=0;
    }else{
    
      newCredit.allowed_credit=credit.allowed_credit+req.body.credit;
      newCredit.utilized_credit=credit.utilized_credit;

    }



    newCredit.available_credit=credit.allowed_credit-credit.utilized_credit+req.body.credit;
    
    


    
   


    let savedreq = await Transaction.create({
      transaction_no: id,
      vehicle_owner: req.params.id,
      particulars: req.body.particulars,
      reference: req.body.reference,
      debit: 0,
      credit: req.body.credit,
      amount_due: newCredit.utilized_credit,
      status: "pay_received",
    });
    
   
      updated = await LiveCredit.findOneAndUpdate(
        { vehicle_owner: req.params.id },
        { $set: newCredit },
        { new: true }
      );

      res.status(200).json({updated,savedreq});
    
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error !");
  }
});

module.exports = router;
