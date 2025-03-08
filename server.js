const express = require('express');
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');
const app = express();

// Enable file upload middleware
app.use(fileUpload());
app.use(express.json());
app.use(express.static('public'));

// Endpoint for file uploads
app.post('/api/upload', (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ message: 'No files were uploaded.' });
    }

    const file = req.files.file;
    const uploadPath = path.join(__dirname, 'public/images/', file.name);

    // Move the file to the images directory
    file.mv(uploadPath, (err) => {
        if (err) {
            return res.status(500).json({ message: 'Error uploading file', error: err });
        }

        res.json({ 
            message: 'File uploaded successfully',
            filePath: `/images/${file.name}`
        });
    });
});

// Add detailed logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    next();
});

// Add error handling middleware
app.use((err, req, res, next) => {
    console.error('Error occurred:', err);
    console.error('Stack trace:', err.stack);
    res.status(500).send('Something broke!');
});

// Log the current directory and build path
console.log('Current directory:', __dirname);
console.log('Build path:', path.join(__dirname, 'build'));
console.log('Build directory contents:', fs.readdirSync(path.join(__dirname, 'build')));

// Serve static files from /j7qf5y/wf path
app.use('/', express.static(path.join(__dirname, 'build')));

// Handle all routes under /j7qf5y/wf
app.get('/*', function (req, res) {
    const indexPath = path.join(__dirname, 'build', 'index.html');
    console.log('Attempting to serve:', indexPath);
    
    if (!fs.existsSync(indexPath)) {
        console.error('index.html not found at:', indexPath);
        return res.status(404).send(`index.html not found at ${indexPath}`);
    }
    
    try {
        const indexContent = fs.readFileSync(indexPath, 'utf8');
        console.log('Successfully read index.html');
        res.send(indexContent);
    } catch (error) {
        console.error('Error reading index.html:', error);
        res.status(500).send('Error reading index.html');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 