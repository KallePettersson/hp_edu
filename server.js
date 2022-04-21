const express = require("express");
require("dotenv").config(); // for loading environment variables
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const passport = require("passport");
const passportSetup = require("./middleware/passport");
const path = require("path");
const users = require("./routes/api/user");
const profile = require("./routes/api/profile");
const excercises = require("./routes/api/exercise");
const publicPath = path.join(__dirname, 'client', 'build');
const app = express();
const cookieParser = require("cookie-parser"); // parse cookie header

//middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// db configuration
const MONGO_URI = process.env.MONGO_URI;


mongoose
   .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
   .then(() => console.log("Mongo Connection successful"))
   .catch(err => console.log("err in mongoose connection", err));

// mongoose.set("useFindAndModify", false);
mongoose.Promise = global.Promise;

// parse cookies
// Used when we set the jwt.
app.use(cookieParser());

app.use(passport.initialize());
passportSetup(passport);


app.use("/api/users", users);
app.use("/api/profile", profile);
app.use("/api/excercises", excercises);

// Serve client
// Signing in oauth with fb/google is giving cors errors in dev, if in dev, uncoment if testing oauth.
// if (process.env.NODE_ENV === "production") {
    app.use(express.static(publicPath));
    app.get("*", (req, res) => {
        // res.send('hello world');
       res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
    });
// }

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server up and running on port ${PORT}`));