import db from '../config/dataBase.js';
import jwt from 'jsonwebtoken';

const authenticate=async(req,res,next)=>{
    const token=req.cookies.token;
    if(!token){
        console.log("No Acess");
        return res.status(401).json({error:"No Token Found\n Pls try again"});
    }
    try{
        const decoded=jwt.verify(token,process.env.JWT_SECRET);
        const userData=await db.query("SELECT id,full_name,gmail,role FROM users WHERE id=$1",[decoded.id]);

        if(userData.rows[0].length==0){
            console.log("User NOt Found");
            return res.status(401).json({error:"User Not Found\n Pls Register"});
        }
        req.userData=userData;
        console.log("Authentication Success")
        next();
    }catch(err){
        console.log("Un Authorized");
        return res.status(401).json({error:err});
    }
};


export default authenticate;