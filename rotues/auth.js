const express = require("express");
const User = require("../models/VehicleOwner");
const Powner = require("../models/Users");
const Attendant = require("../models/Users");
const router = express.Router();
const { body, validationResult } = require("express-validator");
var bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
const LiveCredit = require("../models/LiveCredit");
const fetchpowner = require("../middleware/fetchpowner");
const VehicleOwner = require("../models/VehicleOwner");
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

// Route 1: Create a Vehicle Onwer using :Post (/api/auth/createuser)  pump owner login required
router.post(
  "/createuser",
  [
    body("email", "Enter a valid email ").isEmail(),
    body("name", "Enter valid name").isLength({ min: 2 }),
    body("password", "Password must be of atleast 5 characters ").isLength({
      min: 5,
    }),
    body("phone1", "Enter 10 digit").isLength({ min: 10 }),
  ],
  fetchpowner,
  async (req, res) => {
    const errors = validationResult(req);
    let success = false;
    if (!errors.isEmpty()) {
      return res.status(400).json({ success, errors: errors.array() });
    }
    try {
      //if there are error in this array , then return Bad request and errors
      //findOne chya parameter mmdhe req.body.email mnje jr hya req wala email already exist krtoy tr bad request show kra
      let user = await User.findOne({ phone1: req.body.phone1 });

      if (user) {
        return res
          .status(400)
          .json({ success, error: "Sorry this user is alreay exist !" });
      }

      //bcrypt js is package which help us in the hash, salt , pepper thing
      // genSalt method ne salt generate hot
      //hash method ne hash genrate hoil
      const salt = await bcrypt.genSalt(10);
      const secPass = await bcrypt.hash(req.body.password, salt);
      user = await User.create({
        name: req.body.name,
        password: secPass,
        email: req.body.email,
        phone1: req.body.phone1,
        phone2: req.body.phone2,
      });

      const data = {
        user: { id: user.id },
      };
      //data mdhe id hya sathi vaprliy bcoz id vr index ahe apli so it will be easy and fast to retrive
      //jwt sign method use to sign the secret
      //JWT_SECRET is our 256 bit secret
      const authToken = jwt.sign(data, JWT_SECRET);
      //res.json(user)
      success = true;

      const newId = await User.findOne({ phone1: req.body.phone1 });
      // console.log("newid",newId);

      let livecredit = await LiveCredit.create({
        vehicle_owner: newId._id,
        allowed_credit: req.body.credit,
        utilized_credit: 0,
        available_credit: req.body.credit,
      });

      //authToken return kru apn user la
      res.json({ success, authToken, livecredit });

      // .then(user => res.json(user))
      // .catch(err=>console.log(err))}
    } catch (error) {
      console.error(error.message);
      res.status(500).send("kahi tri gadbad ahe ");
    }
  }
);

//Router 2: Authenticate a Vehicle Owner using :Post (/api/auth/login)  no login required
router.post(
  "/login",
  [
    body("phone1", "Enter a valid phone ").isLength({ min: 10 }).exists(),

    body("password", "Password can not be blank ").exists(),
    body("userType", "Please Select user type").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone1, password, userType } = req.body;
    let user;
    let success;
    if (userType == "attendant" || userType == "p_owner") {
      user = await Powner.findOne({ userType: userType, phone1: phone1 });
      if (!user ) {
        success = false;
        let msg = "User not found";
        return res.status(400).json({ success, msg });
      }else if(user.isActive===false){
        success = false;
        let msg = "This user is deactivated";
         res.status(400).json({ success, msg });
      }
    } else if (userType == "v_owner") {
      user = await User.findOne({ userType: userType, phone1: phone1 });
      if (!user) {
        success = false;
        let msg = "User not found";
        return res.status(400).json({ success, msg });
      }else if(user.isActive===false){
        success = false;
        let msg = "This user is deactivated";
         res.status(400).json({ success, msg });
      }
    }

    try {
      let passwordCompare = await bcrypt.compare(password, user.password);
      if (!passwordCompare) {
        success = false;
        return res
          .status(400)
          .send(success, "Please login with correct credentials");
      }
      const data = {
        id: user.id,
        name:user.name,
        userType: userType,
      };
      //data mdhe id hya sathi vaprliy bcoz id vr index ahe apli so it will be easy and fast to retrive
      //jwt sign method use to sign the secret
      //JWT_SECRET is our 256 bit secret
      const authToken = jwt.sign(data, JWT_SECRET);
      //res.json(user)

      success = true;
      //authToken return kru apn user la
      return res.status(200).json({ success, authToken, data });
    } catch (error) {
      console.error(error.message);
      return res.status(500).send("Internal Server Error !");
    }
  }
);

//Router 3: get all customers : pumpo login required
router.get(
  //middleware to do
  "/getallcust",
  fetchpowner,
  async (req, res) => {
    try {
      const user = await User.find().select("-password");
      res.status(200).json(user);
    } catch (error) {
      console.error(error.message);
      res.status(500).send({ error: "Internal Server Error !" });
    }
  }
);

//Router 4: get details of particular customer : pumpo login required
router.get(
  //middleware to do
  "/getcust/:id",
  fetchpowner,
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id).select("-password");
      const liveCredit = await LiveCredit.findOne({ vehicle_owner: user._id });
      // console.log({ user, liveCredit });
      res.status(200).json({ user, liveCredit });
    } catch (error) {
      console.error(error.message);
      res.status(500).send({ error: "Internal Server Error !" });
    }
  }
);

//Router 5: create attendant : pumpowner login required
router.post(
  "/createatt",
  fetchpowner,
  [
    body("email", "Enter a valid email ").isEmail(),
    body("name", "Enter valid name").isLength({ min: 2 }),
    body("password", "Password must be of atleast 5 characters ").isLength({
      min: 5,
    }),
    body("phone1", "Enter 10 digit").isLength({ min: 10 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    let success = false;
    if (!errors.isEmpty()) {
      return res.status(400).json({ success, errors: errors.array() });
    }
    try {
      //if there are error in this array , then return Bad request and errors
      //findOne chya parameter mmdhe req.body.email mnje jr hya req wala email already exist krtoy tr bad request show kra
      let user = await Attendant.findOne({
        userType: "attendant",
        phone1: req.body.phone1,
      });
      console.log("user", user);

      if (user) {
        return res
          .status(400)
          .json({ success, error: "Sorry this user is alreay exist !" });
      }

      //bcrypt js is package which help us in the hash, salt , pepper thing
      // genSalt method ne salt generate hot
      //hash method ne hash genrate hoil
      const salt = await bcrypt.genSalt(10);
      const secPass = await bcrypt.hash(req.body.password, salt);
      user = await Attendant.create({
        name: req.body.name,
        password: secPass,
        userType: "attendant",
        email: req.body.email,
        phone1: req.body.phone1,
        phone2: req.body.phone2,
      });

      const data = {
        user: { id: user.id, userType: "attendant" },
      };
      //data mdhe id hya sathi vaprliy bcoz id vr index ahe apli so it will be easy and fast to retrive
      //jwt sign method use to sign the secret
      //JWT_SECRET is our 256 bit secret
      const authToken = jwt.sign(data, JWT_SECRET);
      //res.json(user)
      success = true;

      //authToken return kru apn user la
      res.json({ success, authToken });

      // .then(user => res.json(user))
      // .catch(err=>console.log(err))}
    } catch (error) {
      console.error(error.message);
      res.status(500).send("kahi tri gadbad ahe ");
    }
  }
);

//Router6 : get all pump attendants : pump owner login required
router.get("/getallatt", fetchpowner, async (req, res) => {
  try {
    const user = await Attendant.find({ userType: "attendant" }).select(
      "-password"
    );
    res.status(200).json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ error: "Internal Server Error !" });
  }
});

//Router 7 : get particular attendant details : pump owner login required
router.get("/getatt/:id", fetchpowner, async (req, res) => {
  try {
    const user = await Attendant.findById(req.params.id).select("-password");
    res.status(200).json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ error: "Internal Server Error !" });
  }
});

//Router 8: create pumpowner  :  no login required (admin can access this)
router.post(
  "/createpumpo",
  [
    body("email", "Enter a valid email ").isEmail(),
    body("name", "Enter valid name").isLength({ min: 2 }),
    body("password", "Password must be of atleast 5 characters ").isLength({
      min: 5,
    }),
    body("phone1", "Enter 10 digit").isLength({ min: 10 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    let success = false;
    if (!errors.isEmpty()) {
      return res.status(400).json({ success, errors: errors.array() });
    }
    try {
      //if there are error in this array , then return Bad request and errors
      //findOne chya parameter mmdhe req.body.email mnje jr hya req wala email already exist krtoy tr bad request show kra
      let user = await Powner.findOne({
        userType: "p_owner",
        phone1: req.body.phone1,
      });
      console.log("user", user);

      if (user) {
        return res
          .status(400)
          .json({ success, error: "Sorry this user is alreay exist !" });
      }

      //bcrypt js is package which help us in the hash, salt , pepper thing
      // genSalt method ne salt generate hot
      //hash method ne hash genrate hoil
      const salt = await bcrypt.genSalt(10);
      const secPass = await bcrypt.hash(req.body.password, salt);
      user = await Powner.create({
        name: req.body.name,
        password: secPass,
        userType: "p_owner",
        email: req.body.email,
        phone1: req.body.phone1,
        phone2: req.body.phone2,
      });

      const data = {
        user: { id: user.id, userType: "p_owner" },
      };
      //data mdhe id hya sathi vaprliy bcoz id vr index ahe apli so it will be easy and fast to retrive
      //jwt sign method use to sign the secret
      //JWT_SECRET is our 256 bit secret
      const authToken = jwt.sign(data, JWT_SECRET);
      //res.json(user)
      success = true;

      //authToken return kru apn user la
      res.json({ success, authToken });

      // .then(user => res.json(user))
      // .catch(err=>console.log(err))}
    } catch (error) {
      console.error(error.message);
      res.status(500).send("kahi tri gadbad ahe ");
    }
  }
);

//Router 9: delete vehicle owner : pump owner login required
router.delete("/deletevo/:id", fetchpowner, async (req, res) => {
  try {
    // Find the user to be deleted and delete it
    let user = await VehicleOwner.findById(req.params.id);
    if (!user) {
      return res.status(404).send("Not Found");
    }


    const newVo={};
    newVo.isActive=false;
    user = await VehicleOwner.findOneAndUpdate(
      { _id: req.params.id },
      { $set: newVo },
      { new: true }
    );    res.json({ Success: "User has been Deactivated !", user: user});
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error !");
  }
});

//Router 10: update vehicle owner : pump owner login required
router.put("/updatevo/:id", fetchpowner, async (req, res) => {
  const { name, phone1, phone2, email,Credit} = req.body;
  try {
    // Create a newUser object
    const newUser = {};
    if (name) {
      newUser.name = name;
    }
    if (phone1) {
      newUser.phone1 = phone1;
    }
    if (phone2) {
      newUser.phone2 = phone2;
    }
    if (email) {
      newUser.email = email;
    }

    const newCredit = {};

    if (Credit) {
      newCredit.allowed_credit = Credit;
    }

    // Find the user to be updated and update it
    let user = await VehicleOwner.findById(req.params.id);
    let credit = await LiveCredit.find({ vehicle_owner: user._id});
    if (!user && !credit) {
      return res.status(404).send("Not Found");
    }

    user = await VehicleOwner.findByIdAndUpdate(
      req.params.id,
      { $set: newUser },
      { new: true }
    );
    credit = await LiveCredit.findOneAndUpdate(
      { vehicle_owner: user._id },
      { $set: newCredit },
      { new: true }
    );
    res.status(200).json({ user, credit });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error !");
  }
});

//Router 11: delete pump attendant : pump owner login required
router.delete("/deleteatt/:id", fetchpowner, async (req, res) => {
  try {
    // Find the user to be deleted and delete it
    let user = await Attendant.find({
      userType: "attendant",
      _id: req.params.id,
    });
    if (!user) {
      return res.status(404).send("Not Found");
    }

    const newAtt={};
    newAtt.isActive=false;
    user = await Attendant.findOneAndUpdate(
      { _id: req.params.id },
      { $set: newAtt },
      { new: true }
    );
    res.json({ Success: "User has been Deactivated !", user: user });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error !");
  }
});

//Router 12 : update attendant : pump owner login required
router.put("/updateatt/:id", fetchpowner, async (req, res) => {
  const { name, phone1, phone2, email } = req.body;
  try {
    // Create a newUser object
    const newUser = {};
    if (name) {
      newUser.name = name;
    }
    if (phone1) {
      newUser.phone1 = phone1;
    }
    if (phone2) {
      newUser.phone2 = phone2;
    }
    if (email) {
      newUser.email = email;
    }

    // Find the user to be updated and update it
    let user = await Attendant.findById(req.params.id);
    if (!user) {
      return res.status(404).send("Not Found");
    }

    user = await Attendant.findByIdAndUpdate(
      req.params.id,
      { $set: newUser },
      { new: true }
    );
    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error !");
  }
});

module.exports = router;
