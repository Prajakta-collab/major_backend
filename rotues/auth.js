const express = require("express");
const User = require("../models/VehicleOwner");
const Powner = require("../models/Users");
const Attendant = require("../models/Users");
const router = express.Router();
const { body, validationResult } = require("express-validator");
var bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
const LiveCredit = require("../models/LiveCredit");

const JWT_SECRET = "pr@j_l@ves_$u$h";

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
        if (!user) {
           success = false;
          return res
            .status(400)
            .send(success, "User Not Found");
        }
      } else if (userType == "v_owner") {
      
         user = await User.findOne({ userType:userType,phone1: phone1 });
        if (!user) {
           success = false;
          return res
            .status(400)
            .send(success, "User Not Found");
        }}

      try{
        let passwordCompare = await bcrypt.compare(password, user.password);
        if (!passwordCompare) {
          success = false;
          return res
            .status(400)
            .send(success, "Please login with correct credentials");
        }
        const data = {
          id: user.id,
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
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id).select("-password");
      res.status(200).json(user);
    } catch (error) {
      console.error(error.message);
      res.status(500).send({ error: "Internal Server Error !" });
    }
  }
);

//Router 5: create attendant : pumpowner login required
router.post(
  "/createatt",
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

//Router6 : get all pump attendants
router.get(
  //middleware to do
  "/getallatt",
  async (req, res) => {
    try {
      const user = await Attendant.find().select("-password");
      res.status(200).json(user);
    } catch (error) {
      console.error(error.message);
      res.status(500).send({ error: "Internal Server Error !" });
    }
  }
);

//Router 7 : get particular attendant details
router.get(
  //middleware to do
  "/getatt/:id",
  async (req, res) => {
    try {
      const user = await Attendant.findById(req.params.id).select("-password");
      res.status(200).json(user);
    } catch (error) {
      console.error(error.message);
      res.status(500).send({ error: "Internal Server Error !" });
    }
  }
);

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

module.exports = router;
