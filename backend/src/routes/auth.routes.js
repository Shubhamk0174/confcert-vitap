import express from "express";
import { registerAdmin, registerClubAdmin, registerMember } from "../controller/auth/register.js";
import { loginAdmin, loginClubAdmin, loginMember } from "../controller/auth/login.js";
import { getUserData } from "../controller/auth/user.js";
// The below auth middleware are kept to be used later
import { isAuthenticated, isAdmin, isClubAdmin, isMember, isAdminOrClubAdmin } from "../middleware/auth/index.js";

const router = express.Router();

/**
 * @route   POST /api/auth/register/admin
 * @desc    Register a new admin
 * @access  Public
 * @body    { username, password }
 */
router.post("/register/admin", registerAdmin);

/**
 * @route   POST /api/auth/register/club-admin
 * @desc    Register a new club admin
 * @access  Public
 * @body    { username, password }
 */
router.post("/register/club-admin", registerClubAdmin);

/**
 * @route   POST /api/auth/register/member
 * @desc    Register a new member
 * @access  Public
 * @body    { username, password }
 */
router.post("/register/member", registerMember);

/**
 * @route   POST /api/auth/login/admin
 * @desc    Login as admin
 * @access  Public
 * @body    { username, password }
 */
router.post("/login/admin", loginAdmin);

/**
 * @route   POST /api/auth/login/club-admin
 * @desc    Login as club admin
 * @access  Public
 * @body    { username, password }
 */
router.post("/login/club-admin", loginClubAdmin);

/**
 * @route   POST /api/auth/login/member
 * @desc    Login as member
 * @access  Public
 * @body    { username, password }
 */
router.post("/login/member", loginMember);

/**
 * @route   GET /api/auth/user
 * @desc    Get authenticated user data
 * @access  Private (requires authentication middleware)
 */
router.get("/user", isAuthenticated, getUserData);

export default router;
