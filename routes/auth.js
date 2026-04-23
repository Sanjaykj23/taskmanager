import exp from 'express';
import dotenv from 'dotenv';
import supabase from '../config/dataBase.js';
import authenticate from '../middlewares/authmiddleware.js'
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



//New user Register
router.post("/register", async (req, res) => {
    const { fullname, gmail, pass, tech_stack, role } = req.body;

    const { data, error } = await supabase.auth.signUp({
        email: gmail,
        password: pass,
        options: {
            data: {
                full_name: fullname,
                role: role,
                tech_stack: Array.isArray(tech_stack) ? tech_stack.join(", ") : tech_stack
            },
        }
    });

    if (error) return res.status(400).json({ message: "error", details: error.message });

    return res.status(200).json({
        message: "Registration Successful",
        userId: data.user.id,
    });
});


//Login an existing User
router.post("/login", async (req, res) => {
    const { gmail, pass } = req.body;
    if (!gmail || !pass) {
        return res.status(400).json({ message: "Pls fill all fields!" });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email: gmail,
        password: pass,
    });

    if (error) return res.status(400).json({ message: error.message });

    //const token = generateToken(userData.id);


    const token = data.session.access_token;
    res.cookie('token', token, cookieOptions);
    return res.status(200).json({ name: data.user.user_metadata.fullname, message: "Login Success" });
});

//Logout
router.get("/logout", authenticate, async (req, res) => {
    res.cookie('token', '', { ...cookieOptions, maxAge: 1 });
    await supabase.auth.signOut();
    return res.status(200).json({ message: "Logout Success" });
});




//Change Password using Forgot Passsword
router.post("/forgot-password", authenticate, async (req, res) => {
    const { gmail } = req.body;
    const { data, error } = await supabase.auth.resetPasswordForEmail(gmail, { redirectTo: "http://localhost:3000/reset-password", });
    if (error) return res.status(400).json({ message: error.message });
    await supabase.auth.resetPasswordForEmail(gmail, {
        redirectTo: "http://localhost:3000/reset-password",
    });
    res.status(200).json({ message: "Reset Link sent" });
});

router.get("/verify-password", async (req, res) => {
    const{newPassword}=req.body;
    const { data, error } = await supabase.auth.updateUser({
        password: newPassword
    });
    if(error){
        return res.status(400).json({ message: error.message });   
    }
    res.send(200).json({message:"Verified"});
});


export default router;