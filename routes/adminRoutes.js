import exp from 'express';
import dotenv from 'dotenv';
import superbase from '../config/dataBase.js';
import authenticate from '../middlewares/authmiddleware.js'
import {createProject,addNewMember,removeMember,assignTask}from "../controllers/projectController.js";


const router = exp.Router();
const isAdmin = (req, res, next) => {
    if (req.userData.role != 'admin') {
        res.status(200).json({ error: "You are not an Admin" });
    }
    next();
}
const isNotUser=(req,res,next)=>{
    if (req.userData.role != 'user') {
        res.status(200).json({ error: "You are not an Admin" });
    }
    next();
}

router.post("/create-project", authenticate, isAdmin,createProject);

router.post("/add-member", authenticate, isAdmin,addNewMember);

router.post("/remove-member", authenticate, isAdmin,removeMember);

router.post("/assign-task", isNotUser,assignTask);


export default router;