// Set CORS headers for preflight requests
module.exports = (req, res, next) => {
  res.set('Access-Control-Allow-Origin', 'http://localhost:3000'); // can't use * w/firebase
  res.set('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', ['GET','POST','DELETE','PUT']);
    res.set('Access-Control-Allow-Headers', 'Authorization');
    res.set('Access-Control-Max-Age', '3600');
  } 
  return next();
}