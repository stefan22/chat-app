const admin = require('firebase-admin');
const serviceAccount = require('../chatkey.json');
const database = require('../databaseURL.js');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: database,
});

const db = admin.firestore();

module.exports = {admin, db};