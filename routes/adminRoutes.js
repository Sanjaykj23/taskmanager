import exp from 'express';
import dotenv from 'dotenv';
import db from '../config/dataBase.js';
import authenticate from '../middlewares/authmiddleware.js'

const router = exp.Router();
const isAdmin = (req, res, next) => {
    if (req.userData.role != 'admin') {
        res.status(200).json({ error: "You are not an Admin" });
    }
    next();
}

router.post("/createproject", authenticate, isAdmin, async (req, res) => {
    const { project_name, project_desc, adminID, leadID } = req.body;
    try {
        const isLead = await db.query("SELECT role  FROM users WHERE id=$1", [leadID]);
        if (isLead.rows.length == 0 || isLead.rows[0].role != 'team_lead') {
            res.status(400).json({ err: "Invalid Lead ID" });
        }
        const newProject = await db.query("INSERT INTO projects (project_name,project_description,lead_id,admin_id) VALUES ($1,$2,$3,$4)", [project_name, project_desc, leadID, adminID]); 4
    } catch (err) {
        res.status(400).json({ eror: err });
    }
});

router.post("/addmembers", authenticate, isAdmin, async (req, res) => {
    const { project_id, member_id, role } = req.body;
    const isUser = await db.query("SELECT role FROM users WHERE id=$1", [member_id]);
    if (isUser.rows.length == 0 || isUser.rows[0].role != 'user') {
        res.status(400).json({ err: "Invalid User ID" });
    }
    const project = await db.query("SELECT * FROM projects WHERE id=$1", [project_id]);
    if (project.rows.length == 0 || project.rows[0].is_completed == true) {
        res.status(400).json({ error: "Invalid Project ID " });
    }
    const lead = await ("SELECT lead_id FROM projects WHERE project_id=$1", [project_id]);
    await db.query(
        "INSERT INTO project_members (project_id, lead_id,user_id,role) VALUES ($1, $2,$3,$4)",
        [project_id, lead, member_id, role]
    );
    res.status(200).json({ message: "Member Added" });
});

router.post("/removeuser", authenticate, isAdmin, async (req, res) => {
    const { projectId, member_id } = req.body;
    const isUser = await db.query("SELECT role FROM users WHERE id=$1", [member_id]);
    if (isUser.rows.length == 0 || isUser.rows[0].role != 'user') {
        res.status(400).json({ err: "Invalid User ID" });
    }
    const project = await db.query("SELECT * FROM projects WHERE id=$1", [project_id]);
    if (project.rows.length == 0 || project.rows[0].is_completed == true) {
        res.status(400).json({ error: "Invalid Project ID " });
    }
    await db.query("DELETE FROM project_members WHERE user_id=$1", [member_id]);
    res.status(200).json({ message: "User deleted From the Project" });
});

router.patch("/task/complete/:taskId", authenticate, async (req, res) => {
    const result = await db.query("UPDATE TASK SET status= 'completed' WHERE id=$1 AND assigned_to=$2", [req.params.taskId, req.userData.id]);
    res.status(200).json({ message: "Task Status Updated" });
});

export default router;