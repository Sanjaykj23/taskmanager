import exp from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth.js';
import adminRouter from './routes/adminRoutes.js';

dotenv.config();
const app = exp();

// 2. Configure CORS
app.use(cors({
    origin: 'http://localhost:3000', // Allow only your React app
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true // Required since you are using cookies for JWT
}));

app.use(exp.json());
app.use(cookieParser());

app.get("/", (req, res) => {
    console.log("Request ..");
    res.send("<h1>Hello World<h1>");
});

app.use("/api/auth", authRouter);
app.use("/admin",adminRouter);

const port = process.env.PORT || 30000;
app.listen(port, () => {
    console.log("Server listenning on port : ", process.env.PORT);
});

