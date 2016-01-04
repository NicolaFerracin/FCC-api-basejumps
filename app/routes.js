module.exports = function(app) {

	app.get('/*', function(req, res, next) {
		// instantiate null object if the time is not a Date or a unix timestamp
		res.json({"IP" : req.connection.remoteAddress});
	});

};
