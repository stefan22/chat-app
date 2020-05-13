const { db, admin } = require('../utils/admin.js');
const firebaseConfig = require('../firebaseConfig.js');

// helpers
const { isEmail, isEmpty } = require('../helpers');
const { getuserDetails } = require('../utils/getUserDetails');

const firebase = require('firebase');
// fb init
firebase.initializeApp(firebaseConfig);

// user signup
exports.userSignup = (req, res) => {
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
  if (isEmpty(newUser.password)) {
      errors.password = 'Password field cannot be empty';
  }

  if (isEmpty(newUser.confirmPassword)) {
      errors.confirmPassword = 'Confirm password field cannot be empty';
  }

  if (newUser.password !== newUser.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
  }

  // user field
  if (isEmpty(newUser.user)) {
    errors.user = 'User field cannot be empty';
  }

  if (Object.keys(errors).length > 0) {
    console.error(errors);
    return res.status(400).json({errors});
  }

  let token, userId;
  let profileholder = 'profileholder.png';

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
        imageUrl: `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${profileholder}?alt=media`,
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
};
// user login
exports.userLogin = (req, res) => {
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
    return res.status(400).json({errors});
  }

  firebase
    .auth()
    .signInWithEmailAndPassword(loginUser.email, loginUser.password)
    .then((data) => {
      return data.user.getIdToken();
    })
    .then((token) => {
      return res.json({ token });
    })
    .catch((err) => {
      console.error(err);
      if (err.code === 'auth/wrong-password') {
        return res
          .status(403)
          .json({ error: 'Wrong password entered, please try again' });
      }
      return res.status(500).json({ error: err.code });
    });
};
// upload image
exports.uploadImage = (req, res) => {
  const busBoy = require('busboy');
  const path = require('path');
  const os = require('os');
  const fs = require('fs');

  let imageFileName;
  let imageUploaded = {};
  let imageUrl;

  const busboy = new busBoy({ headers: req.headers });
  busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
    console.log(
      'fieldname => ',
      fieldname,
      ' filename => ',
      filename,
      ' mime ',
      mimetype
    );
    if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
      return res.status(400).json({ error: 'Wrong type file submitted' });
    }

    const imageExtension = filename.split('.')[filename.split('.').length - 1];
    // 34892213.png
    imageFileName = `${Math.round(Math.random() * 100000)}.${imageExtension}`;
    const filepath = path.join(os.tmpdir(), imageFileName);
    imageUploaded = { filepath, mimetype };
    file.pipe(fs.createWriteStream(filepath));
  });

  busboy.on('finish', () => {
    admin
      .storage()
      .bucket()
      .upload(imageUploaded.filepath, {
        resumable: false,
        metadata: {
          metadata: {
            contentType: imageUploaded.mimetype,
          },
        },
      })
      .then(() => {
        imageUrl = `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${imageFileName}?alt=media`;
        return db.doc(`/users/${req.body.user}.update(${imageUrl})`);
      })
      .then(() => {
        return res.json({ msg: 'image uploaded successfully' });
      })
      .catch((err) => {
        console.error(err);
        return res.json({ error: err.code });
      });
  });
  busboy.end(req.rawBody);
};
// add user details
exports.addUserDetails = (req, res) => {
  let userDetails = getuserDetails(req.body);
  db.doc(`/users/${req.body.user}`)
    .update(userDetails)
    .then((det) => {
      console.log(det);
      return res.json({ msg: 'user details successfully updated' });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

// get own user details
exports.getAuthenticatedUser = (req, res) => {
  let userData = {};
  db.doc(`/users/${req.body.user}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        userData.protected = doc.data();
        return db.collection('likes').where('user', '==', req.body.user).get();
      }
    })
    .then((data) => {
      userData.likes = [];
      data.forEach((doc) => {
        userData.likes.push(doc.data());
      });
      return res.json(userData);
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};
