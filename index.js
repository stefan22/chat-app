const functions = require('firebase-functions');
const { db } = require('./utils/admin');
const { getMessages, postMessage} = require('./routes/messages');
const { userSignup, userLogin} = require('./routes/users');


const fbAuth = require('./utils/fbAuth');

// app server
const app = require('express')();
// middleware
const cors = require('cors')({ origin: true });
app.use(cors);



// messages
app.get('/messages', getMessages);
// message
app.post('/message', fbAuth, postMessage);


// signup new user
app.post('/signup', userSignup);

// login user
app.post('/login', userLogin);


exports.api = functions.region('europe-west1').https.onRequest(app);
