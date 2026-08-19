const express=require("express")
const authrouter=express.Router();
const authcontroller=require("../controller/auth.controller")
const authmiddleware=require("../middleware/auth.middleware")
// hm yha route bnate hai esko hi bolte hai restapi
/**
 * @router post  /api/auth/register
 * @description register a new user
 * @access  Public
 */
authrouter.post("/register",authcontroller.registercontroller)
/**
 * @router post  /api/auth/login
 * @description login a user
 * @access  Public
 */
authrouter.post("/login",authcontroller.logincontroller)
/**
 * @router get  /api/auth/logout
 * @description logout a user
 * @access  Public
 */
authrouter.get("/logout",authcontroller.logoutcontroller)

authrouter.get("/get-me",authmiddleware.authuser, authcontroller.getmecontroller)


module.exports=authrouter 