const firebase = require('firebase');
const functions = require('firebase-functions');
const { admin, db } = require('./utils/admin.js');
//fb config & db
const firebaseConfig = require('./firebaseConfig.js');
// helpers
const isEmail = require('./helpers/isEmail.js');
const isEmpty = require('./helpers/isEmpty.js');

// app server
const app = require('express')();
// middleware
const cors = require('cors')({ origin: true });
app.use(cors);

// fb init
firebase.initializeApp(firebaseConfig);

const fbAuth = (req,res,next) => {
	let idToken;
	if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
		idToken = req.headers.authorization.split('Bearer ')[1];
	}	else {
		console.error('No token found');
		return res.status(403).json({error: 'Unauthorized'});
	}
	//verify token
	admin.auth().verifyIdToken(idToken)
		.then(decodedToken => {
			req.body.user = decodedToken;
			console.log(decodedToken);
			return db.collection('users')
				.where('userId', '==', req.body.user.uid)
				.limit(1).get();
		})
		.then(data => {
			req.body.user = data.docs[0].data().user;
			return next();
		})
		.catch(err => {
			console.error('Error while verifying the idToken ', err);
		  return res.json({error: 'user cannot be empty'});
		})

};

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
app.post('/message', fbAuth, (req, res) => {
	if (req.body.message.trim() === '') {
		return res.json({msg: 'Message body cannot be empty'});
	}

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

// login user
app.post('/login', (req,res) => {
	const loginUser = {
		email: req.body.email,
		password: req.body.password,
	};

	let errors = {};
	 if (isEmpty(loginUser.email)) {
    errors.email = 'Email field cannot be empty';
   } 
   if (isEmpty(loginUser.password)) {
    errors.password = 'Password field cannot be empty';
   } 
	
	if (Object.keys(errors).length > 0) {
		return res.status(400).json(errors);
	}

	firebase.auth().signInWithEmailAndPassword(loginUser.email, loginUser.password)
		.then((data) => {
			return data.user.getIdToken();
		})
		.then((token) => {
			return res.json({token});
		})
		.catch((err) => {
			console.error(err);
			if (err.code === 'auth/wrong-password') {
				return res.status(403).json({error: 'Wrong password entered, please try again'});
			}
			return res.status(500).json({error: err.code});
		});

});


exports.api = functions.region('europe-west1').https.onRequest(app);
