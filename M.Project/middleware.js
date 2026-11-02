module.exports.isLoggedIn = (req,res, next) =>{
  console.log(req.path, "..",req.originalUrl);
    if(!req.isAuthenticated()){
  req.flash("error","you must be ogged in to create listings!");
  return res.redirect("/login");
}
next();
}