import { registerSchema, validatePassword } from '../validators/authValidate.js';
import { checkUserExist, getMyProfile, isGmailVerified } from '../services/authServices.js';
import supabase from '../config/dataBase.js';
import { email } from 'zod';



//Used while creating token
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: 30 * 24 * 60 * 60 * 1000 //30 days
};


export const register = async (req, res) => {
    try {
        // 1. Zod Validation
        const validatedData = registerSchema.parse(req.body);

        // 2. Business Logic: Check if user already registered
        const exists = await checkUserExist(validatedData.gmail);
        if (exists) {
            return res.status(400).json({ message: "User already registered" });
        }

        // 3. Supabase Auth
        const { data, error } = await supabase.auth.signUp({
            email: validatedData.gmail,
            password: validatedData.pass,
            options: {
                data: {
                    fullname: validatedData.fullname,
                    role: validatedData.role,
                    tech_stack: Array.isArray(validatedData.tech_stack) ? validatedData.tech_stack.join(", ") : validatedData.tech_stack
                }
            }
        });

        if (error) return res.status(400).json({ message: error.message });
        res.status(200).json({ message: "Registration Successful", userId: data.user.id });
    } catch (err) {
        res.status(400).json({ message: "Validation Error", errors: err.errors });
    }
};


export const getMe = async (req, res) => {
    const { data, error } = await getMyProfile(req.userData.id);
    if (error) return res.status(400).json({ message: "Profile not found" });
    res.status(200).json(data);
};


//Login
export const login = async (req, res) => {

    const { gmail, pass } = req.body;
    // 1. Business Logic: Check if user already registered
    const exists = await checkUserExist(gmail);
    console.log(exists);
    if (!exists) {
        console.log("Hello");
        return res.status(400).json({ message: "User was not registered" });
    }
    const { data, err } = await supabase.auth.signInWithPassword(
        {
            email: gmail,
            password: pass
        }
    );

    if (err) {
        return res.status(400).json({ error: err });
    }
    //Check gmail is verified
    if (!isGmailVerified(gmail)) {
        return res.status(400).json({ error: "Gmail was not verified" });
    }

    const token = data.session.access_token;
    res.cookie('token', token, cookieOptions);

    res.status(200).json({ message: "Login Success", Welcome: data.user.user_metadata.fullname });
};

//Logout
export const logout = async (req, res) => {
    res.cookie('token', '', { ...cookieOptions, maxAge: 1 });
    await supabase.auth.signOut();
    return res.status(200).json({ message: "Logout Success" });
}

//Forgot Password
export const forgotpassword = async (req, res) => {
    const { gmail } = req.body;
    const { data, error } = await supabase.auth.resetPasswordForEmail(gmail, { redirectTo: "http://localhost:3000/reset-password", });
    if (error) return res.status(400).json({ message: error.message });
    await supabase.auth.resetPasswordForEmail(gmail, {
        redirectTo: "http://localhost:3000/reset-password",
    });
    res.status(200).json({ message: "Reset Link sent" });
};


//Set new password after verification
export const setNewPassword = async (req, res) => {
    const {pass}=req.body;
    const validatedData = validatePassword.parse(req.body);
    const { data, error } = await supabase.auth.updateUser({
        password: validatedData.pass
    });
    if (error) {
        return res.status(400).json({ message: error.message });
    }
    res.send(200).json({ message: "Verified" });
};
