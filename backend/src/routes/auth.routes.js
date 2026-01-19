import express from "express";
import { registerStudent } from "../controller/auth/registerStudent.js";
import { loginAdmin } from "../controller/auth/loginAdmin.js";
import { loginClubAdmin } from "../controller/auth/loginClubAdmin.js";
import { loginStudent } from "../controller/auth/loginStudent.js";
import { getUserData } from "../controller/auth/getUserDataControler.js";
import { isAuthenticated } from "../middleware/auth.js";


const router = express.Router();

router.post("/register/student", registerStudent);

router.post("/login/student", loginStudent);

router.post("/login/admin", loginAdmin);

router.post("/login/club-admin", loginClubAdmin);

router.get("/get-user-data", isAuthenticated, getUserData);


export default router;
