const express = require("express");
const router = express.Router(); 
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require('passport');
const SECRET = process.env.SECRET;
const validateSignUpInput = require("../../validation/signup");
const validateLoginInput = require("../../validation/login");
const User = require("../../models/User");

// AWS simple email services
const AWS = require('aws-sdk');
const SESconfig = {
   apiVersion: '2010-12-01',
   accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID,
   secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY,
   region: process.env.AWS_SES_REGION
};

let ses = new AWS.SES(SESconfig);

const getVerifyEmailParams = (email, token) => {
   const url = `http://localhost:5000/confirmation/${token}`; // Change to real url
   console.log('getVerifyEmailParams email =', email);
   console.log('getVerifyEmailParams token =', token);
   let params = {
      // Change source to real no-reply when custom domain ready.
      Source: 'karlwilliamlindblom@gmail.com',
      Destination: {
         ToAddresses: [
            email
         ]
      },
      ReplyToAddresses: [
         'karlwilliamlindblom@gmail.com'
      ],
      Message: {
         Body : {
            Html: {
               Charset:"UTF-8",
               // Data : `Please click this email to confirm your email: <a href="${url}">${url}</a>`
               Data: `
               <head>
                   <style>
                       *{font-family: sans; color: #f4f4f4;}
                       h1{background-color:#3f46ad; text-align: center; height: 80px;}
                   </style>
               </head>
               <div style="font-family: sans; color: #f4f4f4; background-color: #323648; overflow-y: hidden;">
                   <h1>Välkommen till HP familjen!</h1>
                   <!-- display: flex; flex-direction: column; justify-content: space-between;   -->
                       <div style="line-height: 1.5; height: 320px; align-items: center;">
                           <p style="text-align:center;">För att slutföra din registrering</p>
                           <p style="text-align:center;">vänligen klicka på verifiera knappen nedan.</p>
                           <div style="display: flex;">
                               <a href="${url}" style="background-color: #3f46ad; color: #f4f4f4; border-radius: 6px; height: 64px; width: 128px; font-size: 16px; font-weight: bold; line-height: 64px; text-align: center; text-decoration: none; margin: 150px auto;">VERIFIERA</a>
                           </div>
                   </div>
               </div>
               `
            }
         },
         Subject: {
            Charset: 'UTF-8',
            Data: 'Välkommen till HP familjen!'
         }
      }
   };
   console.log('getVerifyEmailParams params =', params);

   return params;
};

router.post("/signup", (req, res) => {
   const {errors, isValid} = validateSignUpInput(req.body);
   const {user_name, email, password} = req.body;
   if (!isValid) {
      return res.status(400).json(errors);
   }
   User.findOne({$or:[{email},{user_name}]}).then(user => {
      if (user) {
         if (user.email === email)
            return res.status(400).json({ email: "Email redan registrerad" });
         else
            return res
               .status(400)
               .json({ user_name: "Användarnamnet är upptaget" });
      } else {
         const newUser = new User({ user_name, email, password });
         // hashing password before storing it in database
         bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(newUser.password, salt, (err, hash) => {
               if (err) throw err;
               newUser.password = hash;
               newUser
                  .save()
                  // .then(user => res.json(user))
                  .then(user => {
                     const payload = {
                        id: user.id,
                        user_name: user.user_name,
                        isVerified: true
                     };
                     jwt.sign(payload, SECRET, { expiresIn: 3600 }, (err, token) => {
                        if (err) {
                           console.log(err);
                        }
                        //const param = getVerifyEmailParams(user.email, token);
                        //console.log('param =', param, '\n===========');
                        // ses.sendEmail(param, (err, data) => {
                        //    if (err) {
                        //       console.error('error /signup', err);
                        //    } else {
                        //       console.log(data);
                        //       res.status(200).send('Ett epostmeddelande har skickats till ' + user.email + '.');
                        //    }
                        // });
                     });
                  })
                  .catch(err =>
                     console.log({ error: "Error creating a new user" })
                  );
            });
         });
      }
   });
});

router.post(
   '/confirmation/',
   passport.authenticate("jwt", { session: false }),
   (req, res) => {
      console.log('inne i if ',req.user);
      req.user.isVerified = true;
      console.log('efter isVerified ',req.user);
      req.user
         .save()
         .then(updatedUser => {
            return res.json({
               user: updatedUser
            });
         });
});

router.post(
   'resendVerification',
   (req, res) => {
      const {email} = req.body;
      User.findOne({ email })
         .then(user => {
            jwt.sign(payload, SECRET, { expiresIn: 3600 }, (err, token) => {
               if (err) {
                  console.log(err);
               }
               const param = getVerifyEmailParams(user.email, token);
               console.log('param =', param, '\n===========');
               ses.sendEmail(param, (err, data) => {
                  if (err) {
                     console.error('error /resendVerification', err);
                  } else {
                     console.log(data);
                     res.status(200).send('Ett epostmeddelande har skickats till ' + user.email + '.');
                  }
               });
            });
         })
         .catch(err => {
            console.error('Error i resendVerification ', err);
         });
   }
);

router.post("/login", (req, res) => {
   const { errors, isValid } = validateLoginInput(req.body);
   if (!isValid) {
      return res.status(400).json(errors);
   }
   const { email, password } = req.body;
   User.findOne({ email }).then(user => {
      if (!user) {
         return res.status(404).json({ email: "Epostadress hittades inte" });
      } 
      // else if(!user.isVerified) {
         // return res.status(400).json({ email: "Vänligen verifiera epost för att logga in" });
      // }
      bcrypt.compare(password, user.password).then(isMatch => {
         if (isMatch) {
            const payload = user.isAdmin? {
               id: user.id,
               user_name: user.user_name,
               isAdmin: user.isAdmin
            } : {
               id: user.id,
               user_name: user.user_name
            };
            const { isAdmin, isVerified } = user;
            console.log('/login user', user, isAdmin, isVerified);
            console.log('/login payload', payload);
            jwt.sign(payload, SECRET, { expiresIn: 3600 }, (err, token) => {
               if (err) {
                  console.log(err);
               }
               return res.json({
                  success: true,
                  token: "Bearer " + token
               });
            });
         } else {
            return res.status(400).json({ password: "Felaktigt lösenord" });
         }
      });
   });
});

router.get('/auth/google',
  passport.authenticate('google', { scope: ["profile", "email"]})
);

router.get(
   '/auth/google/redirect',
   passport.authenticate('google', {
      failureRedirect: "/auth/login/failed"
    }),
   (req, res) => {
      signJWT(req,res);
   }
);

router.get('/auth/facebook',
  passport.authenticate('facebook', { scope : ['email'] }));

router.get('/auth/facebook/redirect',
   passport.authenticate('facebook', { failureRedirect: '/login' }),
   (req, res) => {
      signJWT(req,res);
   }
);

const signJWT = (req, res) => {
   // Successful authentication, sign jwt and redirect to success .
   const {id, user_name} = req.user;
     jwt.sign({ id, user_name }, SECRET, { expiresIn: 3600 }, (err, token) => {
        if (err) {
           console.log(err);
           return res.cookie('jwt', {
              success: false,
           });
        }
        res.cookie('jwt', {
           success: true,
           token: "Bearer " + token
        });
        res.redirect('/signup/success'); 
     });
};

// when login is successful, retrieve user info
router.get("/auth/login/success", (req, res) => {
   const { jwt } = req.cookies;
   if (jwt) {
     res.json(jwt);
   } else {
      res.status(401).send('login failed');
   }
});

module.exports = router;