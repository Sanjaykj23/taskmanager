import exp from 'express';
import authenticate from '../middlewares/authmiddleware.js'
import {fetchUserTasks,completeTask}from "../controllers/projectController.js";


const router = exp.Router();

router.get("/my-tasks", authenticate, fetchUserTasks);

router.patch("/update-task", authenticate, completeTask);

export default router;