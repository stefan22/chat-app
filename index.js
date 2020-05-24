const functions = require('firebase-functions');
const cors = require('cors');
const setCorsHeaders = require('./utils/setCorsHeaders');
const fbAuth = require('./utils/fbAuth');

// messages
const {
  getMessages,
  postMessage,
  getMessage,
  addMsgComment,
  likeMessage,
  unlikeMessage,
} = require('./routes/messages');

// users
const {
  userSignup,
  userLogin,
  uploadImage,
  addUserDetails,
  getAuthenticatedUser,
} = require('./routes/users');


// app server
const app = require('express')();


// middleware
app.use(cors());
app.options('*', cors());


// message(s) routes
app.get('/messages', getMessages);

app.post('/message', fbAuth, postMessage);

app.get('/message/:messageId', getMessage);

// delete message

// like message
app.get('/message/:messageId/like', fbAuth, likeMessage);
// unlike message
app.get('/message/:messageId/unlike', fbAuth, unlikeMessage);

// comment on message
app.post('/message/:messageId/comment', fbAuth, addMsgComment);

// user routes
app.post('/signup', userSignup);
app.post('/login', userLogin);


// upload image
app.options('/user/image', setCorsHeaders);
app.post('/user/image', setCorsHeaders, fbAuth, uploadImage);

// add user details
app.post('/user/', fbAuth, addUserDetails);

// get user credentials
app.get('/user',  fbAuth, getAuthenticatedUser);

exports.api = functions.region('europe-west1').https.onRequest(app);
