import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const db=new Pool({
    host:process.env.DB_HOST,
    user:process.env.DB_USER,
    port:process.env.DB_PORT,
    password:process.env.DB_PASSWORD,
    database:process.env.DB_NAME
});

db.on("connect",()=>{
    console.log("Connected to the database");
});

db.on("error",(err)=>{
    console.error("Dtabase Error : ",err);
});

export default db;