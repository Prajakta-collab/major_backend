const express=require('express');
const router=express.Router();
const Transaction=require('../models/Transaction')
const VehicleOwner=require('../models/VehicleOwner')

const { body, validationResult } = require("express-validator");
const expressAsyncHandler =require('express-async-handler');
const LiveCredit = require('../models/LiveCredit');
const uuid=require('uuid')






//Router 1:

router.post('/addreq',expressAsyncHandler (async(req,res)=>{
    console.log(req.body)

    const {transaction_no,vehicle_no,particulars,reference,debit,credit,amount_due,status}=req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
    //   / const userCredit=await LiveCredit.find();

        //console.log("userCredit",userCredit);



        // var tc=uuid().stringyfy().slice(0,5);
        // console.log("tc",tc)
        const newReq=new Transaction({
           transaction_no,vehicle_no,particulars,reference,debit,credit,amount_due,status
        })
        const savedreq=await newReq.save();
        

        res.json(savedreq);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error !");
    }

   

}))

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
// const {status,delivered_date} = req.body;
    try {
        
   
    // Create a newTransaction object
    const newTransaction  = {};
   newTransaction.status = "delivered";
    newTransaction.delivered_date=Date.now();
    

    // Find the note to be updated and update it
    let transactionnew = await Transaction.findById(req.params.id);
    if(!transactionnew){return res.status(404).send("Not Found")}

    // if(note.user.toString() !== req.user.id){
    //     return res.status(401).send("Not Allowed");
    // }

    tr = await Transaction.findByIdAndUpdate(req.params.id, {$set: newTransaction}, {new:true})
    res.json({tr});
} catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error !");
}

})






module.exports=router