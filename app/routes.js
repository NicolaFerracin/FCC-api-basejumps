module.exports = function(app) {

	app.get('/*', function(req, res, next) {
		var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
		res.json({"ipaddress" : ip});
	});

};
