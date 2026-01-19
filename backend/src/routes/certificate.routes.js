import { Router } from "express";
import {  bulkIssueCertificates, issueCertificate} from "../controller/certificate/issueCertificate.js";

import { uploadSingleFile, uploadMultipleFiles } from "../middleware/multer.js";
import { getAllCertificates, getCertificatesBatch, getCertificatesByIssuerAddress, getCertificatesByIssuerName, getCertificatesByRegNo, getCertificatesofuser, getCertificateStats } from "../controller/certificate/getCertificates.js";
import { isAdmin, isAdminOrClubAdmin, isAuthenticated, isClubAdmin } from "../middleware/auth.js";


const certificateRouter = Router();

// Certificate issuance routes
certificateRouter.post("/issue-certificate", isAuthenticated,uploadSingleFile, issueCertificate);
certificateRouter.post("/bulk-issue-certificates",isAuthenticated ,isAdminOrClubAdmin, uploadMultipleFiles, bulkIssueCertificates);


// Certificate retrieval routes (public - no authentication required)
certificateRouter.get("/getcertificate/regno/:regNo", getCertificatesByRegNo);
certificateRouter.get("/getcertificate-user", getCertificatesofuser);
certificateRouter.get("/getcertificate/issuer/:issuerName", getCertificatesByIssuerName);
certificateRouter.get("/getcertificate/issuer-address/:address", getCertificatesByIssuerAddress);
certificateRouter.get("/getcertificate/all", getAllCertificates);
certificateRouter.post("/getcertificate/batch", getCertificatesBatch);
certificateRouter.get("/getcertificate/stats", getCertificateStats);


export default certificateRouter;