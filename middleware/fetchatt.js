var jwt = require('jsonwebtoken');

const JWT_SECRET = "pr@j_l@ves_$u$h";

const fetchatt = (req, res, next) => {
    // Get the user from the jwt token and add id to req object
   
    const token = req.header('auth-token');
    
    // console.log("token",token)
    if (!token) {
        res.status(401).send({ error: "No token. Access Denied !" })
    }
    try {
        const data = jwt.verify(token,JWT_SECRET);
        // console.log(data)
        req.user = data;
     
        if (data.userType == 'attendant') {
            next();
          }else{
            return res.status(400).json({error:"UnAuthorized request"})
          }
    } catch (error) {
        res.status(401).send({ error: "Please authenticate using a valid token" })
    }

}


module.exports = fetchatt;



