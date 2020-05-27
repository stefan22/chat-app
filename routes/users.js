const { db, admin } = require('../utils/admin.js');
const firebaseConfig = require('../firebaseConfig.js');
const { uuid } = require("uuidv4");

// utils
const { validateSignup, validateLogin } = require('../utils/validate');
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

  const { errors, valid } = validateSignup(newUser);

  if (!valid) return res.status(400).json(errors);

  let token, userId;
  let profileholder = 'profileholder.png';

  db.doc(`/users/${newUser.user}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        return res.status(400).json({ regMsg: `There is already a user with this name. Try a different one.` });
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
        token,
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
        return res.status(400).json({ loginMsg: 'There is already an accoun created with this email address.' });
      }
      if (err.code === 'auth/weak-password') {
        return res.status(400).json({regMsg: 'Yahoo weak-like password. Please try again'})
      }

      else {
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

  const { errors, valid } = validateLogin(loginUser);

  if (!valid) return res.status(400).json(errors);

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
          .json({ credentials: 'Wrong credentials entered, please try again' });
      }
      else return res.status(500).json({ error: err.code });
    });
};
// upload image
// Upload a profile image for user
exports.uploadImage = (req, res) => {
  const BusBoy = require("busboy");
  const path = require("path");
  const os = require("os");
  const fs = require("fs");

  const busboy = new BusBoy({ headers: req.headers });

  let imageToBeUploaded = {};
  let imageFileName;
  // String for image token
  let generatedToken = uuid();

  busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
    console.log(fieldname, file, filename, encoding, mimetype);
    if (mimetype !== "image/jpeg" && mimetype !== "image/png") {
      return res.status(400).json({ error: "Wrong file type submitted" });
    }
    // my.image.png => ['my', 'image', 'png']
    const imageExtension = filename.split(".")[filename.split(".").length - 1];
    // 32756238461724837.png
    imageFileName = `${Math.round(
      Math.random() * 1000000000000
    ).toString()}.${imageExtension}`;

    const filepath = path.join(os.tmpdir(), imageFileName);
    imageToBeUploaded = { filepath, mimetype };
    file.pipe(fs.createWriteStream(filepath));
  });
  busboy.on("finish", () => {
    admin
      .storage()
      .bucket(firebaseConfig.storageBucket)
      .upload(imageToBeUploaded.filepath, {
        resumable: false,
        metadata: {
          metadata: {
            contentType: imageToBeUploaded.mimetype,
            //Generate token to be appended to imageUrl
            firebaseStorageDownloadTokens: generatedToken,
          },
        },
      })
      .then(() => {
        // Append token to url
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${imageFileName}?alt=media&token=${generatedToken}`;
        return db.doc(`/users/${req.body.user}`).update({ imageUrl });
      })
      .then(() => {
        return res.json({ message: "image uploaded successfully" });
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).json({ error: "something went wrong" });
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
