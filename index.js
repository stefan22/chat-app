const firebase = require('firebase');
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const serviceAccount = require('./chatkey.json');
//fb config & db
const firebaseConfig = require('./firebaseConfig.js');
const database = require('./databaseURL.js');

// app server
const app = require('express')();
// middleware
const cors = require('cors')({ origin: true });
app.use(cors);

// fb init
firebase.initializeApp(firebaseConfig);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: database,
});

const db = admin.firestore();

// messages
app.get('/messages', (req, res) => {
  db.collection('messages')
    .orderBy('createdAt', 'desc')
    .get()
    .then((data) => {
      let messages = [];
      data.forEach((doc) => {
        messages.push({
          messageId: doc.id,
          user: doc.data().user,
          message: doc.data().message,
          createdAt: doc.data().createdAt,
        });
      });
      return res.json(messages);
    })
    .catch((err) => console.error(err));
});

// message
app.post('/message', (req, res) => {
  const message = {
    user: req.body.user,
    message: req.body.message,
    createdAt: new Date().toISOString(),
  };
  db.collection('messages')
    .add(message)
    .then((doc) => {
      res.json({ msg: `document ${doc.id} created successfully` });
    })
    .catch((err) => {
      console.error(err);
      res.json({ error: 'something happened' });
    });
});

// email format
const isEmail = (email) => {
  const mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  if (email.match(mailformat)) return true;
  else return false;
};

//empty string
const isEmpty = (string) => {
  if (string.trim() === '') return true;
  else return false;
};

// signup new user
app.post('/signup', (req, res) => {
  const newUser = {
    user: req.body.user,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
  };

  let errors = {};
  // email field
  if (isEmpty(newUser.email)) {
    errors.email = 'Email field cannot be empty';
  } else if (!isEmail(newUser.email)) {
    errors.email = 'Must be a valid email address';
  }

  // password field
  if (isEmpty(newUser.password))
    errors.password = 'Password field cannot be empty';
  if (newUser.password !== newUser.confirmPassword)
    errors.confirmPassword = 'Passwords do not match';

  // user field
  if (isEmpty(newUser.user)) errors.user = 'User field cannot be empty';

  if (Object.keys(errors).length > 0) {
    console.error(errors);
    return res.status(400).json(errors);
  }

  let token, userId;
  db.doc(`/users/${newUser.user}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        return res.json({ msg: `user already exists` });
      } else {
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then((data) => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then((idtok) => {
      token = idtok;
      const userCredentials = {
        user: newUser.user,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        userId,
      };
      db.doc(`/users/${newUser.user}`).set(userCredentials);
    })
    .then(() => res.status(200).json({ token }))
    .catch((err) => {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        return res.status(400).json({ msg: 'email already exists' });
      } else {
        return res.status(500).json({ error: err.code });
      }
    });
});

exports.api = functions.region('europe-west1').https.onRequest(app);
