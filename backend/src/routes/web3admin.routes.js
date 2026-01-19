import express from "express";
import {
  getContractDeploymentInfo,
  getCurrentAdminStatus,
  addAdminAddress,
  removeAdminAddress
} from "../controller/web3AdminManagement/web3adminController.js";
import { isAdmin, isAuthenticated } from "../middleware/auth.js";

const router = express.Router();

/**
 * Admin Management Routes
 * These routes interact with the smart contract's admin functions
 */

// Add a new admin
router.post("/add-admin-address", isAuthenticated, isAdmin, addAdminAddress);

// Remove an existing admin
router.post("/remove-admin",isAuthenticated, isAdmin, removeAdminAddress);

// Get contract deployment information
router.get("/get-deployment-info",isAuthenticated, isAdmin, getContractDeploymentInfo);

// Get current wallet's admin status
router.get("/current-wallet-status",isAuthenticated, isAdmin, getCurrentAdminStatus);

export default router;
