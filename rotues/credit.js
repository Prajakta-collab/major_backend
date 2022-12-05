const express=require('express');
const router=express.Router();
const Transaction=require('../models/Transaction')
const VehicleOwner=require('../models/VehicleOwner')

const { body, validationResult } = require("express-validator");
const expressAsyncHandler =require('express-async-handler');
const LiveCredit = require('../models/LiveCredit');
const fetchvowner=require('../middleware/fetchvowner')


//router 4: to get credits for the current logged in vehicle owner
router.get('/fetchcredit',fetchvowner,async(req,res)=>{
  
    try {
        // console.log(req.user.id);
        let credits=await LiveCredit.findOne({vehicle_owner:req.user.id});
        // console.log(credits);
        
    return res.status(200).json(credits);
    } catch (error) {
        console.error(error.message);
      return res.status(500).send("Internal Server Error !");
    }
    

})

//Router 2: get credits of all customers :pump owner login required
router.get('/fetchallcredits',async(req,res)=>{
  
    try {
        // console.log(req.user.id);
        let credits=await LiveCredit.find().populate("vehicle_owner");
        console.log(credits);
        
    return res.status(200).json(credits);
    } catch (error) {
        console.error(error.message);
      return res.status(500).send("Internal Server Error !");
    }
    

})

module.exports=router;