const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173', // Vite default port
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token == null) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Forbidden' });
        req.user = user;
        next();
    });
};

// --- AUTH ROUTES ---

app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hashedPassword], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ error: 'Username already exists' });
                }
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ id: this.lastID, username });
        });
    } catch (err) {
        res.status(500).json({ error: 'Error hashing password' });
    }
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(400).json({ error: 'Invalid username or password' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'Invalid username or password' });

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, username: user.username } });
    });
});

// --- TASKS ROUTES ---

app.get('/api/tasks', authenticateToken, (req, res) => {
    db.all(`SELECT * FROM tasks WHERE user_id = ?`, [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/tasks', authenticateToken, (req, res) => {
    const { title, description, status, due_date } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    
    db.run(
        `INSERT INTO tasks (title, description, status, due_date, user_id) VALUES (?, ?, ?, ?, ?)`,
        [title, description, status || 'AVAILABLE', due_date, req.user.id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            const newTask = {
                id: this.lastID, title, description, status: status || 'AVAILABLE', due_date, user_id: req.user.id
            };
            
            // Broadcast via websocket ONLY to this user's clients
            io.to(req.user.id.toString()).emit('taskCreated', newTask);
            res.status(201).json(newTask);
        }
    );
});

app.put('/api/tasks/:id', authenticateToken, (req, res) => {
    const { title, description, status, due_date } = req.body;
    
    db.run(
        `UPDATE tasks SET title = ?, description = ?, status = ?, due_date = ? WHERE id = ? AND user_id = ?`,
        [title, description, status, due_date, req.params.id, req.user.id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Task not found' });
            
            const updatedTask = {
                id: parseInt(req.params.id), title, description, status, due_date, user_id: req.user.id
            };
            
            // Broadcast via websocket ONLY to this user's clients
            io.to(req.user.id.toString()).emit('taskUpdated', updatedTask);
            res.json(updatedTask);
        }
    );
});

app.delete('/api/tasks/:id', authenticateToken, (req, res) => {
    db.run(`DELETE FROM tasks WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Task not found' });
        
        io.to(req.user.id.toString()).emit('taskDeleted', req.params.id);
        res.json({ message: 'Task deleted' });
    });
});

// Socket.io Authentication Middleware
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return next(new Error('Authentication error'));
        socket.user = user;
        next();
    });
});

// Socket.io Connection
io.on('connection', (socket) => {
    console.log('A user connected:', socket.user.username);
    socket.join(socket.user.id.toString());
    
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.user.username);
    });
});

const PORT = process.env.PORT || 5005;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
