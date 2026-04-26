import supabase from '../config/dataBase.js';
import jwt from 'jsonwebtoken';

const authenticate=async(req,res,next)=>{
    const token=req.cookies.token;
    if(!token){
        console.log("No Acess");
        return res.status(401).json({error:"Pls Login and  try again"});
    }
    try{
        const {data:{user},error}=await supabase.auth.getUser(token);
        if (error || !user) {
            return res.status(401).json({ error: "Invalid or expired session. Please login again." });
        }
        req.userData={
            id:user.id,
            name:user.user_metadata.fullname,
            role:user.user_metadata.role
        }
        console.log("Authentication Success")
        next();
    }catch(err){
        console.log("Un Authorized");
        return res.status(401).json({error:err});
    }
};


export default authenticate;