const { admin,db } = require('./admin.js');

module.exports = (req,res,next) => {
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
			//console.log(decodedToken);
			return db.collection('users')
				.where('userId', '==', req.body.user.uid)
				.limit(1).get();
		})
		.then(data => {
			req.body.user = data.docs[0].data().user;
			req.body.imageUrl = data.docs[0].data().imageUrl;
			return next();
		})
		.catch(err => {
			console.error('Error while verifying the idToken ', err);
		  return res.json({error: 'user cannot be empty'});
		})

};