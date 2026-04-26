import superbase from '../config/dataBase.js';

export const checkUserExist=async (email)=>{
    const {data,error}=await superbase.from("profiles").select("*").eq("gmail",email).single();
    return !!data;
    //return data exist or not 
};

export const getMyProfile=async(id)=>{
    const{data,err}=await superbase.select("profiles").select("*").eq("id",id).single();
    return {data,err};
}

//Check mail is Verified
export const isGmailVerified = async (gmail) => {
    const { data, error } = await superbase
        .from('auth.users') // Supabase system table
        .select('email_confirmed_at')
        .eq('email', gmail)
        .single();

    if (!data) {
    console.log("No user found for email:", gmail);
    return false;
  }

  return !!data.email_confirmed_at; // true if verified, false if not
}