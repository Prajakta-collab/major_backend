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
        const credits=await LiveCredit.findOne({vehicle_owner:req.user.id});
        console.log(credits);
        
    res.json(credits);
    } catch (error) {
        //console.error(error.message);
      res.status(500).send("Internal Server Error !");
    }
    

})


module.exports=router;