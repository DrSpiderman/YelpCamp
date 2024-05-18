const express = require("express");
// if we don't put this mergeParams option, parms will be null
// this is because this router file doesn't have params from app.js file
// unless we specify for express.Router to merge all params
const router = express.Router({ mergeParams: true }); 
const reviews = require("../controllers/reviews");
const { isLoggedIn, validateReview, isReviewAuthor } = require("../middleware");
const catchAsync = require("../utils/catchAsync");

router.post("/", isLoggedIn, validateReview, catchAsync(reviews.createReview));

router.delete("/:reviewId", isLoggedIn, isReviewAuthor, catchAsync(reviews.deleteReview));

module.exports = router;