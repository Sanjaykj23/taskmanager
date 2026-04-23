import exp from 'express';
import dotenv from 'dotenv';
import superbase from '../config/dataBase.js';
import authenticate from '../middlewares/authmiddleware.js'


const router = exp.Router();
const isAdmin = (req, res, next) => {
    if (req.userData.role != 'admin') {
        res.status(200).json({ error: "You are not an Admin" });
    }
    next();
}

router.post("/create-project", authenticate, isAdmin, async (req, res) => {
    const { project_name, project_desc, adminID } = req.body;
    try {
        const { data, error } = await superbase.from("projects").insert([{
            project_name,
            project_deecription: project_desc,
            lead_id: lead,
            admin_id: req.userData.id
        }]);
    } catch (err) {
        res.status(400).json({ eror: err });
    }
    res.status(200).json({ message: "Project Created ", data });
});

router.post("/add-members", authenticate, isAdmin, async (req, res) => {
    const { project_id, member_id, role } = req.body;
    if (!project_id || !member_id || !role) {
        res.status(200).json({ error: "Enter all fields" });
    }
    const { data: isMember } = await superbase.from("profiles").select("id", "gmail").eq('id', project_id).single();
    if (!isMember) {
        res.status(400).json({ err: "Wrong Member ID" });
    }
    const { data: emailVerified } = await superbase.from("auth.user").select("email", "email_confirmed_at").eq("email", isMember.gmail).single();
    if (!emailVerified) {
        res.status(400).json({ err: "Email Not Verified" });
    }
    const { data: isProject } = await superbase.from("projects", "lead_id").select("id").eq('id', project_id).single();
    if (!isProject) {
        res.status(400).json({ err: "Wrong Project ID" });
    }

    const { error } = await supabase.from('project_members').insert([{ project_id, lead_id: isProject.lead_id, user_id: member_id, role: role }]);

    if (error) {
        res.send(400).json({ err: "Could NOt add the user" });
    }

    res.status(200).json({ message: "Member Added" });
});

router.post("/remove-member", authenticate, isAdmin, async (req, res) => {
    const { project_id, member_id } = req.body;
    if (!project_id || !member_id) {
        res.status(200).json({ error: "Enter all fields" });
    }

    const { data: isProject } = await superbase.from("projects", "lead_id").select("id").eq('id', project_id).single();
    if (!isProject) {
        res.status(400).json({ err: "Wrong Project ID" });
    }

    const { error } = await supabase.from('project_members').delete().match({ project_id, user_id: member_id });

    if (error) {
        res.send(400).json({ err: "Could NOt remmove the user" });
    }
    res.status(200).json({ message: "User deleted From the Project" });
});

router.post("/assign-task", async (req, res) => {
    const { project_id, member_id, task, assigned_to } = req.body;
    const { data: project } = await superbase.from("project").select("lead_id").eq('id', project_id).single();
    if (project.lead_id !== req.userData.id) {
        return res.status(403).json({ error: "You are not the lead for this project." });
    }
    const { data: member } = await superbase.from("project_members").select("project_id").eq("user_id", member_id).single();
    if (member.project_id !== project_id) {
        return res.status(403).json({ error: "Wrong user ID" });
    }
    const { data, error } = await supabase.from('tasks').insert([{project_id,title,assigned_to: assigned_to_id,status: 'pending'}]);

    if (error) return res.status(400).json({ error: "Could not assign task." });

    res.json({ message: "Task assigned to member.", data });
});


export default router;