import { Router } from "express";
import { issueCertificateFull, bulkIssueCertificatesFull, getCertificate, verifyCertificate } from "../controller/certificate/issueCertificate.js";
import { uploadSingleFile, uploadMultipleFiles } from "../middleware/multer.js";


const certificateRouter = Router();

// handles IPFS upload, blockchain issuance, and email sending
certificateRouter.post("/issue-certificate", uploadSingleFile, issueCertificateFull);

// Bulk issuance endpoint - handles multiple certificates in one transaction
certificateRouter.post("/bulk-issue-certificates", uploadMultipleFiles, bulkIssueCertificatesFull);

// Certificate retrieval and verification endpoints
certificateRouter.get("/get-certificate/:certificateId", getCertificate);
certificateRouter.get("/verify-certificate/:certificateId", verifyCertificate);

export default certificateRouter;