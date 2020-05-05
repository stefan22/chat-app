//empty string
module.exports = (string) => {
	if (string !== undefined) {
		if (string.trim() === '') return true;
		else return false;
	}
};