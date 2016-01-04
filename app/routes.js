module.exports = function(app) {

	app.get('/*', function(req, res, next) {
		// instantiate null object if the time is not a Date or a unix timestamp
		var returnObj = { "unix" : null,
		"natural" : null };
		// array of months for formatting
		var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
		// get time from URL
		var time = req.params[0];
		// check if the time is a valid Date (not unix)
		var validDate = new Date(time) > 0;
		var validUnix = new Date(time*1000) > 0;
		// if time is a valid Date, put data in the return object
		if (validDate) {
			returnObj.unix = Date.parse(time)/1000;
			returnObj.natural = time;
		} else if (validUnix) {
			// if valid unix timestamp, put the data in the return object
			var unixToDate = new Date(time*1000);
			returnObj.unix = time;
			returnObj.natural = months[unixToDate.getMonth()] + " " + unixToDate.getDate() + ", " + unixToDate.getFullYear();
		}
		res.json(returnObj);
	});

};
