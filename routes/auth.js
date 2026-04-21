import exp from 'express';
import dotenv from 'dotenv';
import db from '../config/dataBase.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import authenticate from '../middlewares/authmiddleware.js'
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { text } from 'stream/consumers';
import { error } from 'console';
import { validateHeaderName } from 'http';
import { mkdirSync } from 'fs';

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


//Email Send and Receive
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

//Verify the given mail
const GenerateOTP = async (userId, gmail, subject = "Account verification") => {
    const otp = crypto.randomInt(100000, 999999);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: gmail,
        subject: subject,
        text: `Your OTP is ${otp}. It expires in 10 minutes.`,
    });

    await db.query(
        "INSERT INTO user_verification (user_id, otp, expires_at) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO UPDATE SET otp=$2 , expires_at=$3",
        [userId, otp, expiresAt]
    );
    console.log("OTP has generated : ", otp);
}

//Verify the Gmail
router.post("/verify-gmail", async (req, res) => {
    const { userId, otp } = req.body;
    const check = await verifyOTP(userId, otp);
    if (check.valid == false) {
        return res.status(400).json({ message: check.message });
    }
    await db.query("UPDATE users SET is_gmail_verified=true WHERE id=$1", [userId]);
    const token = generateToken(userId);
    res.cookie('token', token, cookieOptions);
    console.log("Email Verified Successfull");
    return res.status(200).json({ message: "OTP Verified" });
});

//New user Register
router.post("/register", async (req, res) => {
    const { fullname, gmail, pass, tech_stack, role } = req.body;
    const password = pass.toString();
    if (!fullname || !gmail || !password || !tech_stack || !role) {
        return res.status(400).json({ message: "Pls fill all fields!" });
    }

    const userExist = await db.query("SELECT * FROM users WHERE gmail=$1", [gmail]);
    if (userExist.rows.length > 0) {
        return res.status(400).json({ message: "Email Already Exist" });
    };

    const hashedPassword = await bcrypt.hash(password, 10);


    const newUser = await db.query("INSERT INTO users (full_name,gmail,password_hash,tech_stack,role) VALUES ($1, $2, $3, $4 ,$5) RETURNING id", [fullname, gmail, hashedPassword, tech_stack, role]);
    console.log("Details saved to Data Base");
    console.log("Sending OTP to:", gmail);

    await GenerateOTP(newUser.rows[0].id, gmail);

    return res.status(200).json({ message: "OTP sent to your Gmail",
        userId: newUser.rows[0].id
     });
});


//Login an existing User
router.post("/login", async (req, res) => {
    const { gmail, pass } = req.body;
    if (!gmail || !pass) {
        return res.status(400).json({ message: "Pls fill all fields!" });
    }

    const password = pass.toString();
    const userfound = await db.query("SELECT * FROM users WHERE gmail=$1", [gmail]);
    if (!userfound.rows.length != 0) {
        return res.status(400).json({ message: "User Not Found!\n Please Register" });
    }

    console.log("User Found!");
    const userData = userfound.rows[0];
    const isMatch = await bcrypt.compare(password, userData.password_hash);

    if (!isMatch) {
        return res.status(400).json({ message: "Invalid Paassword!" });
    }

    const token = generateToken(userData.id);

    res.cookie('token', token, cookieOptions);
    return res.status(200).json({ name: userData.full_name, gmail: userData.gmail, message: "Login Success" });
});

//Logout
router.get("/logout", authenticate, (req, res) => {
    res.cookie('token', '', { ...cookieOptions, maxAge: 1 });
    return res.status(200).json({ message: "Logout Success" });
});

//User Details
router.get("/user", authenticate, (req, res) => {
    res.json(userData);
});


//Verify the Otp
const verifyOTP = async (userId, otp) => {
    if (!userId || !otp) {
        return { valid: false, message: "Pls Enter all Fileds" };
    }

    const OTPdetails = await db.query("SELECT otp, expires_at FROM user_verification WHERE user_id=$1", [userId]);
    if (OTPdetails.rows.length == 0) {
        return { valid: false, message: "OTP not generated" };
    }
    const { otp: stored_OTP, expires_at: expiry_Time } = OTPdetails.rows[0];
    if (Date.now() > expiry_Time) {
        return { valid: false, message: "Time Out" };
    }
    if (stored_OTP != otp) {
        return { valid: false, message: "Wrong OTP" };
    }

    return { valid: true, message: "OTP Verified" };
};


//Change Password using Forgot Passsword
router.post("/forgot-password", authenticate, async (req, res) => {
    const { gmail } = req.body;
    const isGmailExist = await db.query("SELECT * FROM users WHERE gmail=$1", [gmail]);
    if (!isGmailExist.rows.length == 0 || isGmailExist.rows[0].is_gmail_verified == false) {
        res.status(200).json({ error: "Email not exist\n Pls Register" });
    }
    await GenerateOTP(isGmailExist.rows[0].id, gmail);
    res.status(200).json({ message: "OTP Generated" });
});

router.get("/reset-password", async (req, res) => {
    const { userId, gmail, pass } = req.body;
    const check = verifyOTP(userId, gmail);
    if (check.valid == false) {
        return res.status(400).json({ message: check.message });
    }
    const password = pass.toString();
    const hashedPassword = await bcrypt.has(password, 10);
    await db.query("UPDATE users SET password_hash=$1 WHERE id=$2", [hashedPassword, userId]);
    await db.query("DELETE FROM user_verification WHERE user_id=$1", [userId]);
    res.status(200).json({ message: "Password updated successfully!" });
});

export default router;