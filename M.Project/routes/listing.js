const express = require("express");
const mongoose = require("mongoose");
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");
const wrapAsync = require("../util/wrapAsync.js");
const ExpressError = require("../util/ExpressError.js");
const {isLoggedIn} = require("../middleware.js")
const router = express.Router();
const listingsControllers = require("../controllers/listings.js");
const {storage} = require("../cloudconfig.js");
const multer = require("multer");
const upload = multer({storage});


const getOwnedListing = async (id, user) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new ExpressError(404, "Listing not found.");
  }

  const listing = await Listing.findById(id);
  if (!listing) {
    throw new ExpressError(404, "Listing not found.");
  }
  if (!listing.owner || !listing.owner.equals(user._id)) {
    throw new ExpressError(403, "You can only manage your own listings.");
  }

  return listing;
};


const validateListing = (req, res, next) => {
  const listing = req.body.listing;
  if (!listing || !listing.title || !listing.price || !listing.location || !listing.country) {
    return next(new ExpressError(400, "Title, price, location, and country are required."));
  }

  if (typeof listing.image === "string") {
    listing.image = listing.image.trim() ? { url: listing.image.trim() } : undefined;
  }

  next();
};


router.get("/", wrapAsync(listingsControllers.index));

router.get("/new", isLoggedIn, listingsControllers.renderNewForm);

router.post("/", isLoggedIn, validateListing, wrapAsync(async (req, res) => {
  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  await newListing.save();
  req.flash("success", "New listings Created!");
  res.redirect("/listings");
}));

router.get("/:id/edit", isLoggedIn, wrapAsync(async (req, res) => {
  const listing = await getOwnedListing(req.params.id, req.user);
  res.render("listings/edit.ejs", { listing });
}));

router.put("/:id", isLoggedIn, validateListing, wrapAsync(async (req, res) => {
  const { id } = req.params;
  await getOwnedListing(id, req.user);

  const listing = await Listing.findOneAndUpdate(
    { _id: id, owner: req.user._id },
    { ...req.body.listing, owner: req.user._id },
    {
      runValidators: true,
      new: true,
    }
  );
  if (!listing) {
    throw new ExpressError(404, "Listing not found.");
  }

  res.redirect(`/listings/${listing._id}`);
}));

router.get("/:id", wrapAsync(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw new ExpressError(404, "Listing not found.");
  }

  const listing = await Listing.findById(id).populate("reviews");
  if (!listing) {
    throw new ExpressError(404, "Listing not found.");
  }

  res.render("listings/show.ejs", { listing });
}));

router.post("/:id/reviews", wrapAsync(async (req, res) => {
  const { rating, comment } = req.body.review || {};
  const parsedRating = Number(rating);

  if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    throw new ExpressError(400, "Rating must be a whole number from 1 to 5.");
  }
  if (typeof comment !== "string" || !comment.trim()) {
    throw new ExpressError(400, "A review comment is required.");
  }
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ExpressError(404, "Listing not found.");
  }

  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    throw new ExpressError(404, "Listing not found.");
  }

  const review = new Review({ rating: parsedRating, comment: comment.trim() });
  await review.save();
  listing.reviews.push(review);
  await listing.save();

  res.redirect(`/listings/${listing._id}`);
}));

router.delete("/:id/reviews/:reviewId", wrapAsync(async (req, res) => {
  const { id, reviewId } = req.params;
  if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(reviewId)) {
    throw new ExpressError(404, "Review not found.");
  }

  const listing = await Listing.findById(id);
  if (!listing || !listing.reviews.some((review) => review.equals(reviewId))) {
    throw new ExpressError(404, "Review not found.");
  }

  listing.reviews.pull(reviewId);
  await listing.save();
  await Review.findByIdAndDelete(reviewId);

  res.redirect(`/listings/${listing._id}`);
}));

router.delete("/:id", isLoggedIn, wrapAsync(async (req, res) => {
  const { id } = req.params;
  await getOwnedListing(id, req.user);

  const deletedListing = await Listing.findOneAndDelete({ _id: id, owner: req.user._id });
  if (!deletedListing) {
    throw new ExpressError(404, "Listing not found.");
  }

  res.redirect("/listings");
}));

module.exports = router;
