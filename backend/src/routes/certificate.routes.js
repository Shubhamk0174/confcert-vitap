import { Router } from "express";
import { sendCertificateEmail } from "../controller/certificate/sendCertificate.js";
import { uploadCertificateToIpfs } from "../controller/certificate/uploadCertificateToIpfs.js";
import { uploadSingleFile } from "../middleware/multer.js";


const certificateRouter = Router();

certificateRouter.post("/send-certificate-email", sendCertificateEmail);
certificateRouter.post("/upload-to-ipfs", uploadSingleFile, uploadCertificateToIpfs);

export default certificateRouter;