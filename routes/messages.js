
const { db } = require('../utils/admin.js')



exports.getMessages = (req, res) => {
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
    .catch((err) => {
			console.error(err)
			res.json({error: err.code});
		});
}

exports.postMessage = (req, res) => {
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
}