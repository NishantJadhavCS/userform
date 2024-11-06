const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;
const usersFile = path.join(__dirname, 'users.json');

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint to handle form submissions
app.post('/post', (req, res) => {
    const { name, email, password } = req.body;

    // Validation for empty fields
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    // Name validation: only letters and spaces allowed
    const namePattern = /^[A-Za-z\s]+$/;
    if (!namePattern.test(name)) {
        return res.status(400).json({ message: 'Name must contain only letters and spaces' });
    }

    // Email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
    }

    // Password validation: minimum 8 characters
    if (password.length < 8) {
        return res.status(400).json({
            message: 'Password must be at least 8 characters long'
        });
    }

    fs.readFile(usersFile, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Could not read data file' });
        }

        let users = [];
        if (data) {
            users = JSON.parse(data);
        }

        const userExists = users.some((user) => user.email === email);
        if (userExists) {
            return res.status(409).json({ message: 'User already exists' });
        }

        // Incremental user ID assignment
        const nextId = users.length > 0 ? users[users.length - 1].id + 1 : 1;
        const newUser = { id: nextId, name, email, password };

        users.push(newUser);

        fs.writeFile(usersFile, JSON.stringify(users, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ message: 'Could not save user data' });
            }
            res.status(201).json({ message: 'User registered successfully' });
        });
    });
});

// Endpoint to get all users (for debugging)
app.get('/users', (req, res) => {
    fs.readFile(usersFile, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Could not read data file' });
        }
        const users = data ? JSON.parse(data) : [];
        res.status(200).json(users);
    });
});

// Endpoint to search for a user by ID
app.get('/users/:id', (req, res) => {
    const userId = parseInt(req.params.id, 10);

    fs.readFile(usersFile, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Could not read data file' });
        }

        const users = data ? JSON.parse(data) : [];
        const user = users.find((u) => u.id === userId);

        if (user) {
            res.status(200).json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
