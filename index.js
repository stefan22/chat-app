const functions = require('firebase-functions');
const { db } = require('./utils/admin');
// messages
const { getMessages, postMessage, getMessage} = require('./routes/messages');
// users
const { 
	userSignup, 
	userLogin, 
	uploadImage, 
	addUserDetails,
	getAuthenticatedUser,

} = require('./routes/users');


const fbAuth = require('./utils/fbAuth');

// app server
const app = require('express')();
// middleware
const cors = require('cors')({ origin: true });
app.use(cors);



// message(s) routes
app.get('/messages', getMessages);
app.post('/message', fbAuth, postMessage);
app.get('/message/:messageId', getMessage);

// delete message

// like message

// unlike message

// comment on message




// user routes
app.post('/signup', userSignup);
app.post('/login', userLogin);
// upload image
app.post('/user/image', fbAuth, uploadImage);
// add user details
app.post('/user/', fbAuth, addUserDetails)
// get user credentials
app.get('/user', fbAuth, getAuthenticatedUser);


exports.api = functions.region('europe-west1').https.onRequest(app);
