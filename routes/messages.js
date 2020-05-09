const { db } = require('../utils/admin.js');

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
      console.error(err);
      res.json({ error: err.code });
    });
};

exports.getMessage = (req, res) => { 
  let messageData = {};
  db.doc(`/messages/${req.params.messageId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.json({ error: 'message not found' });
      }
      messageData = doc.data();
      messageData.messageId = doc.id;
      // message comments
      return db
        .collection('comments')
        .orderBy('createdAt', 'desc')
        .where('messageId', '==', req.params.messageId)
        .get();
    })
    .then((data) => {
      messageData.comments = [];
      data.forEach((doc) => {
        messageData.comments.push(doc.data());
      });
      return res.json(messageData);
    })
    .catch((err) => {
      console.error(err);
      return res.json({ error: err.code });
    });
};

exports.postMessage = (req, res) => {
  if (req.body.message.trim() === '') {
    return res.json({ msg: 'Message body cannot be empty' });
  }

  const message = {
    user: req.body.user,
    message: req.body.message,
    imageUrl: req.body.imageUrl,
    createdAt: new Date().toISOString(),
    likeCount: 0,
  };
  db.collection('messages')
    .add(message)
    .then((doc) => {
      const resmsg = message;
      resmsg.id = doc.id;
      res.json({ msg: `document ${doc.id} created successfully.` });
    })
    .catch((err) => {
      console.error(err);
      res.json({ error: 'something happened' });
    });
};


// add comment to messasge
exports.addMsgComment = (req, res) => {
  if (req.body.comment.trim() === '') {
    res.status(400).json({ error: 'Comment body cannot be empty'});
  }

  const comment = { 
    comment: req.body.comment,
    user: req.body.user,
    imageUrl: req.body.imageUrl,
    messageId: req.params.messageId,  
    createdAt: new Date().toISOString(),
  };
  //msg exists
  db.doc(`/messages/${req.params.messageId}`).get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({error: 'Message not found'});
      }
      return db.collection('comments').add(comment);
    })
    .then((doc) => {
      return res.json({msg: `New comment created. Comment Id: ${doc.id}`});
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({error: err.code});
    })

 
}


// like message
exports.likeMessage = (req,res) => {
  //cant like twice
  const likeDoc = db.collection('likes').where('user','==',req.body.user)
    .where('messageId','==',req.params.messageId).limit(1);
  //message handle
  const messageDoc = db.doc(`/messages/${req.params.messageId}`);

  let messageData = {};
  messageDoc.get()
    .then((doc) => {
      if(doc.exists) {
        messageData = doc.data();
        messageData.messageId = doc.id;
        return likeDoc.get();
      }
      else {
        return res.status(404).json({error: 'Message not found'});
      }
    })
    .then(data => {
      if (data.empty) {
        return db.collection('likes').add({
          messageId: req.params.messageId,
          user: req.body.user
        })
        .then(() => {
          messageData.likeCount++;
          return messageDoc.update({likeCount: messageData.likeCount});
        })
        .then(() => {
          return res.json(messageData);
        })
      }
      else {
        return res.status(400).json({error: 'Message already liked'});
      }
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({error: err.code});
    })
}


// unlike message
exports.unlikeMessage = (req,res) => {
   //cant like twice
  const likeDoc = db.collection('likes').where('user','==',req.body.user)
    .where('messageId','==',req.params.messageId).limit(1);
  //message handle
  const messageDoc = db.doc(`/messages/${req.params.messageId}`);

  let messageData = {};
  messageDoc.get()
    .then((doc) => {
      if(doc.exists) {
        messageData = doc.data();
        messageData.messageId = doc.id;
        return likeDoc.get();
      }
      else {
        return res.status(404).json({error: 'Message not found'});
      }
    })
    .then(data => {
      if (data.empty) {
        return res.status(400).json({error: 'Message not liked'});
        
      }
      else {
        return db.doc(`/likes/${data.docs[0].id}`).delete()
          .then(() => {
            messageData.likeCount--;
            return messageDoc.update({likeCount: messageData.likeCount});
          })
          .then(() => {
            res.json(messageData);
          })
      }
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({error: err.code});
    })

}