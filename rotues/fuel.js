const express=require('express');
const router=express.Router();
const Transaction=require('../models/Transaction')
const VehicleOwner=require('../models/VehicleOwner')

const { body, validationResult } = require("express-validator");
const expressAsyncHandler =require('express-async-handler');
const LiveCredit = require('../models/LiveCredit');
const generateUniqueId = require('generate-unique-id');
const fetchvowner=require('../middleware/fetchvowner');




 


//Router 1:

router.post('/addreq',fetchvowner, async(req,res)=>{
    // console.log("req.body",req)

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
        console.log("req.user.id",req.user.id);
      const userCredit=await LiveCredit.findOne({vehicle_owner:req.user.id});

        console.log("userCredit",userCredit);

        
       

        //if req.body.debit <= userCredit.available_credit then raising req is fine 
      
            if(req.body.debit < userCredit.available_credit){
              
                const id = generateUniqueId();
    
                // console.log("id",id)
                
                let savedreq = await Transaction.create({
                    transaction_no:id,
                    vehicle_owner:req.user.id,
                    vehicle_no:req.body.vehicle_no,
                    particulars:req.body.particulars,
                    reference:req.body.reference,
                    debit:req.body.debit,
                    credit:req.body.credit,
                    amount_due:req.body.amount_due,
                    status:'req_received'
                   
                  });
                
        
                res.json(savedreq);
            
            }else{
                res.status(500).send("Your Credit is not enough");
            }
        
       

        
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error !");
    }

   

})

//Router 2: 

router.get('/getallreq',async(req,res)=>{
  
    try {
        const requests=await Transaction.find({status:'req_received'});
        //console.log(requests);
    res.json(requests);
    } catch (error) {
        //console.error(error.message);
      res.status(500).send("Internal Server Error !");
    }
    

})

router.put('/completereq/:id', async (req, res) => {
    try {
     
    // Create a newTransaction object
    const newTransaction  = {};
   newTransaction.status = "delivered";
    newTransaction.delivered_date=Date.now();
    
  
    // Find the transaction to be updated and update it
    let transactionnew = await Transaction.findById(req.params.id);
    console.log("new transaction",transactionnew);
   
    if(!transactionnew){return res.status(404).send("Not Found")}
    let savedcredit;

    if(transactionnew){
            //find live credit of that customer to be updated
            let cust_credit=await LiveCredit.findOne({vehicle_owner:transactionnew.vehicle_owner});
            const newCredit={};
           
            //allowed_credit as it is
            //utilized_credit = utilized_credit+ transactionnew.debit
            //avaialble_credit= available_credit-transactionnew.debit

            newCredit.utilized_credit=cust_credit.utilized_credit+transactionnew.debit;
            newCredit.available_credit=cust_credit.available_credit-transactionnew.debit;

            //update live credit of that customer

            savedcredit=await LiveCredit.findByIdAndUpdate(cust_credit._id,{$set:newCredit},{new:true});

            newTransaction.amount_due=savedcredit.utilized_credit;
            newTransaction.credit=savedcredit.allowed_credit;
            
            tr = await Transaction.findByIdAndUpdate(req.params.id, {$set: newTransaction}, {new:true})

        
    }

    res.json({tr,savedcredit});
} catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error !");
}

})





module.exports=router