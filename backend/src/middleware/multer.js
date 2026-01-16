import multer from 'multer';

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
  },
  fileFilter: (req, file, cb) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/pdf'];
    if (validTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed'), false);
    }
  }
});

// Export the single file upload middleware
export const uploadSingleFile = upload.single('file');

// Export the multiple files upload middleware (for bulk operations)
export const uploadMultipleFiles = upload.array('files', 100); // Max 100 files