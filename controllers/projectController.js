import superbase from "../config/dataBase.js";
import { getAllProjects, getMyTasks, updateTaskStatus,getProjectMemberStats } from "../services/projectServices.js"
// 1. Create a new Project (Admin Only)
export const createProject = async (req, res) => {
    const { project_name, project_desc, leadID } = req.body;

    const { data, error } = await superbase
        .from("projects")
        .insert([{
            project_name,
            project_description: project_desc, // Fixed typo
            lead_id: leadID,
            admin_id: req.userData.id
        }])
        .select();

    if (error) return res.status(400).json({ error: error.message });

    const projectId = data[0]?.id;
    if (!projectId) {
        return res.status(400).json({ error: "Project ID not returned" });
    }
    
    const { data2, error2 } = await superbase
        .from('project_members')
        .insert([{ project_id:projectId, user_id:leadID, role:"team_lead" }]);

    if (error2) return res.status(400).json({ error: "Could not add member. They might already be in the project." });
    res.status(201).json({ message: "Project Created Successfully", data });
};


// 2. Add member to Project
export const addNewMember = async (req, res) => {
    const { project_id, member_id, role } = req.body;

    // 1. Industry Standard: Validate all fields are present
    if (!project_id || !member_id || !role) {
        return res.status(400).json({ error: "Missing required fields: project_id, member_id, or role." });
    }

    try {
        // 2. Normalization: Ensure role is lowercase to match Enum
        const normalizedRole = role.toLowerCase().trim();

        // 3. Verify user exists in profiles
        const { data: profile, error: profileErr } = await superbase
            .from("profiles")
            .select("id")
            .eq("id", member_id)
            .maybeSingle();

        if (profileErr || !profile) {
            return res.status(404).json({ error: "Member ID not found in user profiles." });
        }

        // 4. Verify project exists
        const { data: project, error: projectErr } = await superbase
            .from("projects")
            .select("id")
            .eq("id", project_id)
            .maybeSingle();

        if (projectErr || !project) {
            return res.status(404).json({ error: "Project ID not found." });
        }

        // 5. The Insert
        const { error: insertError } = await superbase
            .from('project_members')
            .insert([{ 
                project_id, 
                user_id: member_id, 
                role: normalizedRole 
            }]);

        if (insertError) {
            // Handle unique constraint (user already in project)
            if (insertError.code === '23505') {
                return res.status(400).json({ error: "User is already a member of this project." });
            }
            // Handle the 22P02 (Invalid Enum or UUID)
            if (insertError.code === '22P02') {
                return res.status(400).json({ error: "Invalid data format. Check if IDs are UUIDs and role is 'admin', 'team_lead', or 'user'." });
            }
            throw insertError;
        }

        res.status(200).json({ message: "Member Added Successfully" });

    } catch (err) {
        console.error("Critical Error in addNewMember:", err);
        res.status(500).json({ error: "Internal Server Error", details: err.message });
    }
};

//Remove an existing member
export const removeMember = async (req, res) => {
    const { project_id, member_id } = req.body;
    if (!project_id || !member_id) {
        res.status(200).json({ error: "Enter all fields" });
    }

    const { data: isProject } = await superbase.from("projects", "lead_id").select("id").eq('id', project_id).single();
    if (!isProject) {
        res.status(400).json({ err: "Wrong Project ID" });
    }

    const { error } = await superbase.from('project_members').delete().match({ project_id, user_id: member_id });

    if (error) {
        res.send(400).json({ err: "Could NOt remmove the user" });
    }
    res.status(200).json({ message: "User deleted From the Project" });
};


// 3. Assign Task (Lead Only)
export const assignTask = async (req, res) => {
    const { project_id, member_id, title } = req.body;

    // The RLS policy we wrote above handles the "Is this person the lead?" check automatically!
    const { data, error } = await superbase
        .from('tasks')
        .insert([{
            project_id,
            title,
            assigned_to: member_id,
            status: 'pending'
        }])
        .select();

    if (error) return res.status(403).json({ error: "Task assignment failed. You may not have permission." });

    res.status(201).json({ message: "Task assigned to member.", data });
};

// For Admins/Leads: Get everything
export const fetchDashboardData = async (req, res) => {
    const { data, error } = await getAllProjects();
    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json(data);
};

// For Users: Get assigned tasks
export const fetchUserTasks = async (req, res) => {
    const { data, error } = await getMyTasks(req.userData.id);
    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json(data);
};

// For Users: Mark task as completed
export const completeTask = async (req, res) => {
    const { taskId, status } = req.body; // status should be 'completed'
    const { data, error } = await updateTaskStatus(taskId, req.userData.id, status);
    
    if (error || data.length === 0) {
        return res.status(400).json({ error: "Could not update task. Ensure it is assigned to you." });
    }
    res.status(200).json({ message: "Task updated successfully", data });
};


export const viewProjectMembers = async (req, res) => {
    const { projectId } = req.params;

    try {
        const memberStats = await getProjectMemberStats(projectId);
        
        if (!memberStats || memberStats.length === 0) {
            return res.status(404).json({ message: "No members found for this project." });
        }

        res.status(200).json({
            project_id: projectId,
            members: memberStats
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch members", details: err.message });
    }
};