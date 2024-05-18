// use .env file when not in production

if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate"); // npm packige for bolerplate, very usefull
const session = require("express-session");
const flash = require("connect-flash"); // npm packige for flash msgs
const ExpressError = require("./utils/ExpressError");
const methodOverride = require('method-override'); // pack for adding methods for html forms - PUT, DELETE etc.
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user");
// routs files
const userRouts = require("./routs/users")
const campgroundRouts = require("./routs/campgrounds");
const reviewRouts = require("./routs/reviews");
// packige for security, disabling some chars (like $) in queries, req params etc.
const mongoSanitize = require('express-mongo-sanitize');
// packige for security, adds aditional headers to every request
const helmet = require('helmet');
// requring MongoStore for storing sessions in the DB
const MongoStore = require('connect-mongo');
// url for our DB
 const dbUrl = process.env.DB_URL;
// const dbUrl = "mongodb://127.0.0.1:27017/yelp-camp"



try {
    mongoose.connect(dbUrl);
    console.log("DB IS HERE!")
} catch(err) {
    console.log(err);
}

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", () => {
    console.log("Database connected");
});

const app = express();

app.engine("ejs", ejsMate); // setting ejs as engine for dynamic html pages
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); // merging paths

app.use(express.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
app.use(mongoSanitize());

// creating mongo store for storing sessions

const store = MongoStore.create({
    mongoUrl: dbUrl,
    touchAfter: 24 * 60 * 60,
    crypto: {
        secret: 'thisshouldbeabettersecret!'
    }
});

store.on("error", function(e){
    console.log('Session store error:', e);
});

// configuring session with store

const sessionConfig = {
    store,
    secret: "thisshouldbeabettersecret!",
    resave: false,
    saveUninitialized: true,
    cookie: {                                           
        httpOnly: true, // cookies can only be accessed with html, thus preventing hacking scripts for accessing them
        expires: Date.now + 1000 * 60 * 60 * 24 * 7, // expiration date for cookies
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

app.use(session(sessionConfig));
app.use(flash());
app.use(helmet({
    contentSecurityPolicy: false // an object for setting up helmet
}));

// passport functionality for user auth

app.use(passport.initialize()); // initializing passport
app.use(passport.session()); // passport uses sessions for auth, so this line must be bellow app.use(session()); if this is not used, User would have to login on every requiest
passport.use(new LocalStrategy(User.authenticate())); // choosing strategy for auth, Local Strategy in this case; app can have multiple auth strategies

passport.serializeUser(User.serializeUser()); // storing user into the session
passport.deserializeUser(User.deserializeUser()); // getting user out of the session

// res.locals are variables that we have access to in the templates
// they are very useful if you need some information you want to render
// success and error are flash messages we have access to on every request, so is current user (if there is any)
// they are like global variables, always there

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
});

app.get("/fakeUser", async (req, res) => {
    const user = new User({
        email: "lea@gmail.com",
        username: "lea"
    });
    const newUser = await User.register(user, "chichi");
    res.send(newUser);
})

app.use("/", userRouts);
app.use("/campgrounds", campgroundRouts);
app.use("/campgrounds/:id/reviews", reviewRouts);

app.get("/", (req, res) => {
    res.render("home");
});

app.all("*", (req, res, next) => {
    next(new ExpressError("Page Not Found", 404));
}); 

app.use((err, req, res, next) => {
    console.log(err.status);
    const { status = 500} = err;
    if(!err.message) err.message = "Something went wrong!";
    res.status(status).render("error", { err });
})

app.listen(3000, () => {
    console.log("Serving on port 3000!");
});