const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const port = 3000;

// Enable CORS
app.use(cors());
app.use(express.json());

// Configure multer for PDF storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/pdfs';
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed!'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Upload PDF endpoint
app.post('/api/upload-pdf', upload.single('pdf'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No PDF file uploaded' });
        }
        
        const fileUrl = `/uploads/pdfs/${req.file.filename}`;
        res.json({
            success: true,
            filename: req.file.filename,
            url: fileUrl
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Download PDF endpoint
app.get('/api/download-pdf/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads/pdfs', filename);

    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).json({ error: 'PDF file not found' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 