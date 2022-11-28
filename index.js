const connectToMongo=require('./db')
const express = require('express')
var cors = require('cors')


connectToMongo();
const app = express()
const port = 5001


app.use(express.json());
app.use(cors())


//available routes

app.use("/api/fuel", require("./rotues/fuel"));
app.use("/api/auth",require("./rotues/auth"));
app.use("/api/credit",require("./rotues/credit"));


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})