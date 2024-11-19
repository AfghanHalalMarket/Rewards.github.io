const express = require('express');
const multer = require('multer');
const archiver = require('archiver');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 3000;

// Setup multer storage engine for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Serve static files (HTML, CSS, JS)
app.use(express.static('public'));

// Middleware to parse JSON bodies
app.use(express.json());

// Endpoint for uploading files and zipping them
app.post('/upload', upload.array('files', 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send('No files uploaded');
  }

  // Create a ZIP archive
  const zipName = `archive_${Date.now()}.zip`;
  const output = fs.createWriteStream(`uploads/${zipName}`);
  const archive = archiver('zip', { zlib: { level: 9 } });

  archive.pipe(output);

  // Add each uploaded file to the archive
  req.files.forEach(file => {
    archive.file(file.path, { name: file.originalname });
  });

  archive.finalize();

  output.on('close', () => {
    // Send the zip file to the client
    res.json({
      zipFile: zipName,
      message: 'Upload and zipping complete'
    });
  });

  output.on('error', (err) => {
    console.error('Archive error:', err);
    res.status(500).send('Error creating zip file');
  });
});

// Endpoint to serve the uploaded zip files for download
app.get('/download/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'uploads', req.params.filename);
  res.download(filePath, req.params.filename, (err) => {
    if (err) {
      console.error('Download error:', err);
      res.status(500).send('Error downloading file');
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
