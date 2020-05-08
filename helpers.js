// email format
const isEmail = (email) => {
  const mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  if (email.match(mailformat)) return true;
  else return false;
};


const isEmpty = (string) => {
	if (string !== undefined) {
		if (string.trim() === '') return true;
		else return false;
	}
};


module.exports = { isEmail, isEmpty };




