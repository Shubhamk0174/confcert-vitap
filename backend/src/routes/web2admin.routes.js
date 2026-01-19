import { Router } from "express";
import { deleteAdmin, deleteClubAdmin, getAllAdmins, getAllClubAdmins, registerAdminCredentials, registerClubAdmin } from "../controller/web2AdminManagement.js/web2AdminController.js";
import { isAdmin, isAuthenticated } from "../middleware/auth.js";


const router = Router()


router.post("/register/admin",isAuthenticated, isAdmin, registerAdminCredentials);

router.post("/get-admins", isAuthenticated, isAdmin, getAllAdmins);

router.post("/register/club-admin",isAuthenticated, isAdmin, registerClubAdmin);

router.post("/get-club-admins",isAuthenticated, isAdmin, getAllClubAdmins);

router.delete("/delete-admin/:id", isAuthenticated, isAdmin, deleteAdmin);

router.delete("/delete-club-admin/:id", isAuthenticated, isAdmin, deleteClubAdmin);


export default router;




