const functions = require('firebase-functions');
const { db } = require('./utils/admin');
const { getMessages, postMessage} = require('./routes/messages');
const { userSignup, userLogin, uploadImage, addUserDetails} = require('./routes/users');


const fbAuth = require('./utils/fbAuth');

// app server
const app = require('express')();
// middleware
const cors = require('cors')({ origin: true });
app.use(cors);



// message(s) routes
app.get('/messages', getMessages);
app.post('/message', fbAuth, postMessage);



// user routes
app.post('/signup', userSignup);
app.post('/login', userLogin);
// upload image
app.post('/user/image', fbAuth, uploadImage);
// add user details
app.post('/user/', fbAuth, addUserDetails)



exports.api = functions.region('europe-west1').https.onRequest(app);
