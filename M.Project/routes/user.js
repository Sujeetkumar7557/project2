const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const passport = require("passport");

router.get("/signup", (req, res) => {
  res.render("users/signup.ejs");
});

router.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;
  const newUser = new User({ username, email });
  await User.register(newUser, password);

  req.flash("success", "Welcome to Wonderlust!");
  res.redirect("/listings");
});

router.get("/login", (req, res) => {
  res.render("users/login.ejs");
});

router.post("/login",
    passport.authenticate("local",{
        failureRedirect:'/login',
         failureFlash: true,
        }), 
        (req, res) => {
          req.flash("success", "Welcome back!");
          res.redirect("/listings");
        }
    );

    router.get("/logout", (req,res,next) =>{
      req.logout((err) =>{
        if (err){
          next(err);
        }
        req.flash("success", "you are logged out!");
        res.redirect("/listings");
      })
    } )


module.exports = router;