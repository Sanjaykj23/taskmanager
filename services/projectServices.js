import superbase from "../config/dataBase";
// Fetch projects for Admin/Lead (RLS handles the filtering)
export const getAllProjects = async () => {
    return await superbase.from("projects").select(`*,
        profiles:lead_id (full_name, gmail),
        project_members (count)
    `);
};


// Fetch tasks for a specific user
export const getMyTasks = async (userId) => {
    return await superbase
        .from("tasks")
        .select("*, projects(project_name)")
        .eq("assigned_to", userId);
};

// Update task status
export const updateTaskStatus = async (taskId, userId, status) => {
    return await superbase
        .from("tasks")
        .update({ status })
        .match({ id: taskId, assigned_to: userId }) // Ensure user only updates THEIR task
        .select();
};


export const getProjectMemberStats = async (projectId) => {
    // We fetch project_members and "reach through" to get their profile and tasks
    const { data, error } = await superbase
        .from("project_members")
        .select(`
            role,
            profiles:user_id (
                id,
                full_name,
                gmail
            ),
            tasks:user_id (
                id,
                status
            )
        `)
        .eq("project_id", projectId);

    if (error) throw error;

    // Clean up the data to make it easy for the frontend
    return data.map(item => ({
        id: item.profiles.id,
        name: item.profiles.full_name,
        email: item.profiles.gmail,
        project_role: item.role,
        total_tasks: item.tasks.length,
        completed_tasks: item.tasks.filter(t => t.status === 'completed').length,
        pending_tasks: item.tasks.filter(t => t.status === 'pending').length
    }));
};