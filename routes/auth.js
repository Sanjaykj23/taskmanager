import exp from 'express';
import dotenv from 'dotenv';
import supabase from '../config/dataBase.js';
import authenticate from '../middlewares/authmiddleware.js'
import {register,login,logout,getMe,forgotpassword,setNewPassword} from '../controllers/authController.js';
import { text } from 'stream/consumers';
import { error } from 'console';
import { validateHeaderName } from 'http';
import { mkdirSync } from 'fs';
import { fromJSONSchema } from 'zod';

const router = exp.Router();
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: 30 * 24 * 60 * 60 * 1000 //30 days
};

const generateToken = ((id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
});



//New user Register
router.post("/register",register);

//Login an existing User
router.post("/login",login);

//Logout
router.get("/logout", authenticate,logout);

//Change Password using Forgot Passsword
router.post("/forgot-password", authenticate,forgotpassword);

//Verify Password
router.get("/verify-password",setNewPassword);


export default router;