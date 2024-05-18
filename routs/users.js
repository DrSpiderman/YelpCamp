const express = require("express");
const router = express.Router();
const passport = require("passport");
const users = require("../controllers/users");
const catchAsync = require("../utils/catchAsync")
const { storeReturnTo } = require("../middleware");

router.route("/register")
    .get(users.renderRegister)
    .post(catchAsync(users.registerUser));

// .post passport middleware function for authentication on login
// it takes some options, flashing on falure is true and redirection on falure to "/login"
// storeReturnTo is storing a path where user was in the moment of redirection to login
// it is storing original path in the res.locals, check the middleware file
// then the redirectUrl is set to that original url

router.route("/login")
    .get(users.renderLogin)
    .post(
        storeReturnTo, 
        passport.authenticate("local", { failureRedirect: "/login", failureFlash: true}), 
        users.loginUser
    );

router.get("/logout", users.logoutUser); 

module.exports = router;