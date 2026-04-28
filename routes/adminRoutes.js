import exp from 'express';
import dotenv from 'dotenv';
import superbase from '../config/dataBase.js';
import authenticate from '../middlewares/authmiddleware.js'
import {createProject,addNewMember,removeMember,assignTask,fetchDashboardData,fetchUserTasks,completeTask,viewProjectMembers}from "../controllers/projectController.js";


const router = exp.Router();
const isAdmin = (req, res, next) => {
    if (req.userData.role != 'admin') {
        res.status(200).json({ error: "You are not an Admin" });
    }
    next();
}
const isNotUser=(req,res,next)=>{
    if (req.userData.role != 'user') {
        res.status(200).json({ error: "You are not an Admin or not a Team lead" });
    }
    next();
}

router.post("/create-project", authenticate, isAdmin,createProject);

router.post("/add-member", authenticate, isAdmin,addNewMember);

router.post("/remove-member", authenticate, isAdmin,removeMember);

router.post("/assign-task", isNotUser,assignTask);

//See all projects:
router.get("/all-projects",authenticate,isAdmin)

// Admin or Lead can call this to see their team's status
router.get("/projects/:projectId/members-status", authenticate, isNotUser, viewProjectMembers);


export default router;