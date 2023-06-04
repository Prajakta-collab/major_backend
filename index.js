const connectToMongo = require("./db");
const express = require("express");
const mongoose=require('mongoose')
var cors = require("cors");
require('dotenv').config()
const Grid=require('gridfs-stream');
const upload = require("./middleware/upload");

let gfs;
connectToMongo();
const app = express();
const port =  process.env.PORT ||5001;

app.use(express.json());
app.use(cors());

const conn=mongoose.connection;
conn.once("open",function(){
gfs=Grid(conn.db,mongoose.mongo);
gfs.collection("photos");
});



//available routes

app.use("/api/fuel", require("./rotues/fuel"));
app.use("/api/auth", require("./rotues/auth"));
app.use("/api/credit", require("./rotues/credit"));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
