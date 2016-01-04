module.exports = function(app) {

	app.get('/*', function(req, res, next) {
		var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
		var softwareRx = /\((.*?)\)/;
		var userAgent = req.headers['user-agent'];
		var software = userAgent.match(softwareRx)[1];
		var language = req.headers['accept-language'].split(",")[0];
		res.json({"ipaddress" : ip, "language" : language, "software" : software});
	});

};
