const express = require('express');
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');
const app = express();

// MySQL connection pool
let pool;
try {
    pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'wildflower',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });
    console.log('MySQL connection pool created');
} catch (error) {
    console.error('Error creating MySQL connection pool:', error);
}

// Enable file upload middleware
app.use(fileUpload());
app.use(express.json());
app.use(express.static('public'));

// Ensure MySQL tables exist
async function initializeDatabase() {
    if (!pool) return;
    
    try {
        // Create checklist_items table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS checklist_items (
                item_id INT AUTO_INCREMENT PRIMARY KEY,
                task VARCHAR(255) NOT NULL,
                category VARCHAR(100) NULL,
                due_description VARCHAR(100) NULL
            )
        `);
        
        // Create monthly_progress table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS monthly_progress (
                id INT AUTO_INCREMENT PRIMARY KEY,
                item_id INT NOT NULL,
                year INT NOT NULL,
                month INT NOT NULL,
                due_date DATE NOT NULL,
                due_time TIME NOT NULL DEFAULT '09:00:00',
                is_completed BOOLEAN DEFAULT FALSE,
                completed_at TIMESTAMP NULL,
                notes TEXT NULL,
                FOREIGN KEY (item_id) REFERENCES checklist_items(item_id),
                UNIQUE KEY (item_id, year, month)
            )
        `);
        
        console.log('Database tables initialized');
    } catch (error) {
        console.error('Error initializing database tables:', error);
    }
}

// Initialize the database on startup
initializeDatabase();

// API endpoint to get checklist items for a specific month
app.get('/api/checklist', async (req, res) => {
    try {
        // Get year and month from query parameters (defaults to current month/year)
        const today = new Date();
        const year = parseInt(req.query.year) || today.getFullYear();
        const month = parseInt(req.query.month) || today.getMonth() + 1;
        
        // Get all tasks for the specified month
        const [rows] = await pool.query(`
            SELECT mp.id, mp.item_id, ci.task, mp.due_date, mp.due_time, mp.is_completed, mp.completed_at, mp.notes
            FROM monthly_progress mp
            JOIN checklist_items ci ON mp.item_id = ci.item_id
            WHERE mp.year = ? AND mp.month = ?
        `, [year, month]);
        
        res.json(rows);
    } catch (error) {
        console.error('Error fetching checklist items:', error);
        res.status(500).json({ message: 'Error fetching checklist items', error: error.message });
    }
});

// API endpoint to add a new checklist item
app.post('/api/checklist', async (req, res) => {
    try {
        const { task, due_date, due_time, is_completed, year, month } = req.body;
        
        if (!task || !due_date || !year || !month) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        
        // Start a transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();
        
        try {
            // First, insert or get the checklist item
            let itemId;
            const [existingItems] = await connection.query('SELECT item_id FROM checklist_items WHERE task = ?', [task]);
            
            if (existingItems.length > 0) {
                // Use existing item
                itemId = existingItems[0].item_id;
            } else {
                // Create new item
                const [result] = await connection.query(
                    'INSERT INTO checklist_items (task) VALUES (?)',
                    [task]
                );
                itemId = result.insertId;
            }
            
            // Then, create the monthly progress entry
            const [progressResult] = await connection.query(
                `INSERT INTO monthly_progress 
                (item_id, year, month, due_date, due_time, is_completed) 
                VALUES (?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                due_date = VALUES(due_date), 
                due_time = VALUES(due_time),
                is_completed = VALUES(is_completed)`,
                [itemId, year, month, due_date, due_time || '09:00:00', is_completed || false]
            );
            
            await connection.commit();
            
            // Return the created item
            const [newItem] = await pool.query(
                `SELECT mp.id, mp.item_id, ci.task, mp.due_date, mp.due_time, mp.is_completed
                FROM monthly_progress mp
                JOIN checklist_items ci ON mp.item_id = ci.item_id
                WHERE mp.id = ?`,
                [progressResult.insertId]
            );
            
            res.status(201).json(newItem[0]);
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error adding checklist item:', error);
        res.status(500).json({ message: 'Error adding checklist item', error: error.message });
    }
});

// API endpoint to update a checklist item
app.put('/api/checklist/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const { task, due_date, due_time, is_completed, notes } = req.body;
        
        // Start a transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();
        
        try {
            // Get the current item
            const [currentItems] = await connection.query(
                'SELECT item_id FROM monthly_progress WHERE id = ?', 
                [id]
            );
            
            if (currentItems.length === 0) {
                await connection.rollback();
                return res.status(404).json({ message: 'Item not found' });
            }
            
            const itemId = currentItems[0].item_id;
            
            // Update the task text if provided
            if (task) {
                await connection.query(
                    'UPDATE checklist_items SET task = ? WHERE item_id = ?',
                    [task, itemId]
                );
            }
            
            // Update the monthly progress
            const updates = [];
            const params = [];
            
            if (due_date) {
                updates.push('due_date = ?');
                params.push(due_date);
            }
            
            if (due_time) {
                updates.push('due_time = ?');
                params.push(due_time);
            }
            
            if (is_completed !== undefined) {
                updates.push('is_completed = ?');
                params.push(is_completed);
                
                if (is_completed) {
                    updates.push('completed_at = NOW()');
                } else {
                    updates.push('completed_at = NULL');
                }
            }
            
            if (notes !== undefined) {
                updates.push('notes = ?');
                params.push(notes);
            }
            
            if (updates.length > 0) {
                params.push(id);
                await connection.query(
                    `UPDATE monthly_progress SET ${updates.join(', ')} WHERE id = ?`,
                    params
                );
            }
            
            await connection.commit();
            
            // Return the updated item
            const [updatedItem] = await pool.query(
                `SELECT mp.id, mp.item_id, ci.task, mp.due_date, mp.due_time, mp.is_completed, mp.completed_at, mp.notes
                FROM monthly_progress mp
                JOIN checklist_items ci ON mp.item_id = ci.item_id
                WHERE mp.id = ?`,
                [id]
            );
            
            res.json(updatedItem[0]);
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error updating checklist item:', error);
        res.status(500).json({ message: 'Error updating checklist item', error: error.message });
    }
});

// API endpoint to delete a checklist item
app.delete('/api/checklist/:id', async (req, res) => {
    try {
        const id = req.params.id;
        
        // Delete the monthly progress entry
        await pool.query('DELETE FROM monthly_progress WHERE id = ?', [id]);
        
        res.json({ message: 'Item deleted successfully' });
    } catch (error) {
        console.error('Error deleting checklist item:', error);
        res.status(500).json({ message: 'Error deleting checklist item', error: error.message });
    }
});

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