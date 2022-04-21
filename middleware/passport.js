const JwtStrategy = require("passport-jwt").Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const User = require("../models/User");
const SECRET = process.env.SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;

const opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = SECRET;

module.exports = passport => {

   passport.serializeUser((user, done) => {
      done(null, user.id);
   });
   
   passport.deserializeUser((id, done) => {
      User.findById(id)
          .then(user => {
            done(null, user);
          })
          .catch(err => {
             console.error('Failed to deserialize an user ', err);
          });
   });

   passport.use(
      new JwtStrategy(opts, (jwt_payload, done) => {
         User.findOne({ _id: jwt_payload.id })
            .then(user => {
               if (user) {
                  return done(null, user);
               } else {
                  return done(null, false);
               }
            })
            .catch(err =>
               console.log({ error: "Error authenticating the user" })
            );
      })
   );

//    passport.use(new GoogleStrategy({
//        clientID: GOOGLE_CLIENT_ID,
//        clientSecret: GOOGLE_CLIENT_SECRET,
//        callbackURL: '/api/users/auth/google/redirect'
//      },
//       (accessToken, refreshToken, profile, done) => {
//        const {displayName, id, emails} = profile;
//        const email = emails[0].value;
//        User.findOne({$or:[{email},{'google.id': id}]})
//            .then(user => {
//               // Check if user already exists   
//               if(user) {
//                  if(user.google.id) {
//                   // User exists and has signed in with google before
//                   done(null, user);
//                  } else {
//                   // User has signed before but not with google.
//                   user.google = { 'id': id };
//                   user
//                      .save()
//                      .then(updatedUser => done(null, updatedUser))
//                      .catch(err => console.log({ error: "Error creating a new user with google" }, err));
//                  }
//               } else {
//                   const newUser = new User({
//                      user_name: displayName.replace(/\s/g, '_'),
//                      email: email,
//                      google: { id, accessToken },
//                      isVerified: true
//                   });
//                   newUser
//                   .save()
//                   .then((newUser) => {
//                      done(null, newUser);
//                   })
//                   .catch(err => {
//                      console.log({ error: "Error creating a new user with google" }, err);
//                   })
//               }
//            })
//      }
//    ));

//    passport.use(new FacebookStrategy({
//       clientID: FACEBOOK_APP_ID,
//       clientSecret: FACEBOOK_APP_SECRET,
//       callbackURL: '/api/users/auth/facebook/redirect',
//       profileFields: ['id', 'displayName', 'emails']
//     },
//     (accessToken, refreshToken, profile, done) => {
//       const {displayName, id, emails} = profile;
//        const email = emails[0].value;
//        User.findOne({$or:[{email},{'facebook.id': id}]})
//            .then(user => {
//               // Check if user already exists   
//               if(user) {
//                  if(user.facebook.id) {
//                   // User exists and has signed in with google before
//                   done(null, user);
//                  } else {
//                   // User has signed before but not with google.
//                   user.facebook = { 'id': id };
//                   user
//                      .save()
//                      .then(updatedUser => done(null, updatedUser))
//                      .catch(err => console.log({ error: "Error creating a new user with google" }, err));
//                  }
//               } else {
//                   const newUser = new User({
//                      user_name: displayName.replace(/\s/g, '_'),
//                      email: email,
//                      facebook: { id, id },
//                      isVerified: true
//                   });
//                   newUser
//                   .save()
//                   .then((newUser) => {
//                      done(null, newUser);
//                   })
//                   .catch(err => {
//                      console.log({ error: "Error creating a new user with google" }, err);
//                   })
//               }
//            })
//     }
//   ));
};