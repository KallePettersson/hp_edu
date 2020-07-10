const express = require("express");
const router = express.Router();

const isAuthenticated = (req, res, next) => {
    next();
};

const checkToken = (req, res, next) => {
    const header = req.headers['authorization'];

    if(typeof header !== 'undefined') {
        const bearer = header.split(' ');
        const token = bearer[1];

        req.token = token;
        next();
    } else {
        //If header is undefined return Forbidden (403)
        console.log('F A I L :/');
        res.sendStatus(403)
    }
}


router.get(
    "/",
    checkToken,
    (req, res) => {
        //verify the JWT token generated for the user
        jwt.verify(req.token, process.env.SECRET, (err, authorizedData) => {
            if(err){
                //If error send Forbidden (403)
                console.log('ERROR: Could not connect to the protected route');
                res.sendStatus(403);
            } else {
                //If token is successfully verified, we can send the autorized data 
                res.json({
                    message: 'Successful log in',
                    authorizedData
                });
                console.log('SUCCESS: Connected to protected route');
            }
        })
    }
);

module.exports = router;
