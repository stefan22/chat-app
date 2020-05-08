const { db } = require('../utils/admin.js');
const firebaseConfig = require('../firebaseConfig.js');
const firebase = require('firebase');
// fb init
firebase.initializeApp(firebaseConfig);

// helpers
const { isEmail, isEmpty } = require('../helpers');



exports.userSignup =  (req, res) => {
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
}

exports.userLogin = (req,res) => {
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

}