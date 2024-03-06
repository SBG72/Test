// express is a nodejs backend server framework
// http is . . . http: hyper text transfer protocol
// allows for data transfer over port 80 connection
const express = require('express');
const http = require('http');

// Bodyparser and path are both middlewares that allow the nodejs server to integrate with the front-end
const bodyparser = require('body-parser');
const path = require('path');

// Middlewares to encrypt, there are many to choose from and many different implementations for each
// This one is potentially the simplest
const bcrypt = require('bcrypt'); // Encrypts password
const jwt = require('jsonwebtoken'); // Generates login token for user after successful authentication,
const SECRET_DONT_TELL =
    'hjbasdvjlsbglksd@$%^$^h^%&gl&$$!@iwughr8293524y^*&()*&$^#%@$!@87rawyo8vbaf@#%wd!89$^%&^%rq34lht7ovnhqoe9_nw4=r9gwu3_05y3_wq93-2i0';
// NEVER PASS UNSECURE SENSITIVE MESSAGES/DATA BACK AND FORTH FROM THE SERVER WITHOUT LINES 13 AND 14

// app is an instance of express
// server uses http to create a server out of the express app
const app = express();
const server = http.createServer(app);

// Port declaration, checks for pre-defined port and if none found uses 80 instead
const PORT = process.env.port || 80;

// THE FOLLOWING IS FOR TESTING CONTENT, THIS IS A QUICK, DIRTY, AND CHEAP SOLUTION TO NOT WANTING TO BUILD A DATABASE
// NEVER DO THIS IN PRODUCTION
// THIS IS FOR TEACHING PURPOSES ONLY
const users = [];

// This is the front-end routing
// NOTE: this integration with front-end minimal as we have ReactJS set up for front-end routing
// Usually is more involved with frameworks like Laravel which Davis prefers
// You're not using Laravel, you're in some BS Python backend lol
app.use(bodyparser.json()); // Use middleware to interpret JSON
//app.use(express.static(__dirname + '/front-end/build')); // Express will only read from front-end/build

// Single Page App (SPA) only serves one file, terrible for Foogle indexing but fine for captsone
// GET request with express app
app.get('*', (req, res) => { // App will accept all paths (ie /login /register /whatever) and run the following code
    // Result sends SPA file because of front-end routing
    res.status(200).send({ message: 'This is for development testing ' }); // Path middleware to make life easier
});

// POST requests with express app

/**
 * LOGIN
 * Route: /api/login
 * username: string
 * password: string
 * returns: message, redirect, status
 */
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = users.filter((u) => u.username.toLowerCase() === username.toLowerCase()) [0]; // non-case sensitve

    if(!user) return res.status(401).json({ // No user found
        // Vague message that doesn't allude to which information was correct, prevents certain attacks
        message: 'Username or password invalid, please verify that you have the correct information and try again.',
        redirect: '/login',
        status: 401
    });

    // Has to be below valid user check, compares password with hashed data
    const auth = bcrypt.compare(password, user.password);

    if(!auth) return res.status(401).json({ // Bad Password
        // Vague message that doesn't allude to which information was correct, prevents certain attacks
        message: 'Username or password invalid, please verify that you have the correct information and try again.',
        redirect: '/login',
        status: 401
    });

    // Token avoids storing user data on front-end and allows for quick back-end authentication

    const token = jwt
        .sign({ username: user.username /* bad use, never do this (always use something unique and doesn't change like id) */ },
        SECRET_DONT_TELL,
        /* Don't be like me, set an expiry in production */);

    return res.status(200)
        .json(/*JSON OBJECT: */{ status: 200, token, redirect: '/home' }); // use / in your job
});

/**
 * REGISTER
 * Route: /dev/register
 * username: string
 * password: string
 * returns: message, redirect, status
 */
app.post('/dev/register', async (req, res) => {
    // This endpoint designed for adding accounts through a dev portal

    const { username, password } = req.body;
    const HashedBrowns = await bcrypt.hash(password, 10); // Hash and salt -- never store plain text passwords even when testing

    const user = { // Generate user object
        username, // plaintext username is ideal
        password: HashedBrowns // hashed and salted password
    }

    if(!user) {
        console.log('Error Testing: Error occurred in /dev/register endpoint, user account was not generated.');
        return res.status(500)
            .json({ status: 500, message: 'An error occurred on our end, please try again later' });
    }

    // This could be written better but I'm lazy
    if(users.filter((u) => u.username.toLowerCase() === username.toLowerCase())[0])
        return res.status(401).json({
            status: 401,
            message: 'A user already exists with this username.',
            redirect: '/register'
        });

    users.push(user); // Add user into "DB" (array)

    // This is one implementation, there are many and with sockets it's even easier. This is quick and dirty.
    return res.status(200).json(/*JSON OBJECT: */{
        status: 200,
        message: 'Registration successful, please login.',
        redirect: '/login'
    });
});

/**
 * USER DATA
 * Route: /api/get-user
 * username: string
 * token: encoded JSON object, string
 * returns status, user
 */
app.post('/api/get-user', async (req, res) => {
    const { username, token } = req.body;
    var user;

    // The following code is redundant as all hell
    // This is only done for teaching purposes
    // Code is written in such a way to show proper structure in acquiring user data
    // If all we wanted was the username then it could be like 4 lines of code with a return

    if(username) user = users.filter((u) => u.username.toLowerCase() === username.toLowerCase())[0]; // Always keep lowercase

    if(token) {
        let decode = jwt.verify(token, SECRET_DONT_TELL); // Compare token with secret
        user = users.filter((u) => u.username.toLowerCase() === token.username.toLowerCase())[0]; // Grab user from encoded data
    }

    if(!user && !token) return res.status(500)
        .json( { status: 500, message: 'An error occurred on our end, please try again later' });
    else {
        // NEVER SEND ALL USER DATA OVER CONNECTION
        // TO SOLVE: Create user object that takes only necessary information to populate front-end
        // This could be things like username, pronouns, avatar, posts
        // In this use case it's just the username so it's kinda redundant to create a user object for that but in this
        // case it's fine

        const USER_SAFE = {
            username: user.username
        }

        return res.status(200).json({ status: 200, user: USER_SAFE });
    }
});

server.listen(PORT, () => console.log('Listening on: ' + PORT));