var multer  = require('multer');
var upload = multer({ dest: 'uploads/' });
var Search = require('./search_model.js');
var Url = require('./url_model.js');
var request = require('request');
var GOOGLE_SEARCH_ENGINE = "013173385250721980599:m-mhprc8ftw";
var GOOGLE_API_KEY = "AIzaSyDlf7ANED9sDitd3yVL71yH5HQ4uMxsqQo";

module.exports = function(app) {

	// get different apps homepages
	app.get('/time', function(req, res, next) {
		res.redirect('time.html');
	});

	app.get('/parser', function(req, res, next) {
		res.redirect('parser.html');
	});

	app.get('/size', function(req, res, next) {
		res.redirect('size.html');
	});

	app.get('/image', function(req, res, next) {
		res.redirect('image.html');
	});

	app.get('/url', function(req, res, next) {
		res.redirect('url.html');
	});


	//#################################################
	// timestap basejump
	app.get('/time/*', function(req, res, next) {
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


	//#################################################
	// Parser basejump
	app.get('/parser/getInfo', function(req, res, next) {
		var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
		var softwareRx = /\((.*?)\)/;
		var userAgent = req.headers['user-agent'];
		var software = userAgent.match(softwareRx)[1];
		var language = req.headers['accept-language'].split(',')[0];
		res.json({'ipaddress' : ip, 'language' : language, 'software' : software});
	});


	//#################################################
	// image size basejump
	app.post('/image', upload.single('image'), function (req, res, next) {
		res.json('The file size is: ' + req.file.size + ' bytes.');
	});


	//#################################################
	// image search basejump
	// search route
	app.get('/api/imagesearch/:search', function(req, res, next) {
		// array to show to the user populated with the results objs
		var results = [];
		// generate URL using API and ENGIN keys plus the search the user wants to perform
		var url = "https://www.googleapis.com/customsearch/v1?searchType=image&key=" + GOOGLE_API_KEY +
		"&cx=" + GOOGLE_SEARCH_ENGINE + "&q=" + req.params.search;
		if (req.query.offset) {
			url += "&start=" + req.query.offset;
		}
		// GET request
		request(url, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				// parse the body and get needed stuff
				jsonResult = JSON.parse(body);
				// the results are stored in the items obj
				// go through all of them and add them to the results obj we are going to show the user
				for (var i = 0; i < jsonResult.items.length; i++) {
					results.push({
						"url" : jsonResult.items[i].link,
						"snippet" : jsonResult.items[i].snippet,
						"thumbnail" : jsonResult.items[i].image.thumbnailLink,
						"context" : jsonResult.items[i].image.contextLink
					});
				}
				// create search obj to store for when a user wants to see the latest searches
				var search = {
					"term" : req.params.search,
					"when" : (new Date()).toISOString()
				};
				// save search obj
				Search.create(search, function(err, search) {
					if (err) {
						console.log({"error" : "There has been an error"});
					}
				});
				res.json(results);
			} else {
				res.json({"error" : "There has been an error"})
			}
		});
	});

	// latest searches route
	app.get('/api/latest/imagesearch', function(req, res, next) {
		Search.find().sort({'when' : -1}).limit(10).exec(function(err, searches) {
			// if err, send it
			if (err) {
				res.json({"error" : "There has been an error"});
			} else {
				res.json(searches.map(function (search) {
					return {"term" : search.term, "when" : search.when }
				}));
			}
		});
	});


	//#################################################
	// url shortner basejump
	// get new url and turn them into short ones
	app.get('/url/new/*', function(req, res, next) {
		var originalUrl = req.params[0];
		var id;
		// source https://github.com/jzaefferer/jquery-validation/blob/master/src/core.js#L1191
		var valid = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})).?)(?::\d{2,5})?(?:[/?#]\S*)?$/i.test( originalUrl );
		// if url is not valid, return error
		if (!valid) {
			res.json({"error" : "invalid URL"});
		} else {
			// check if the url is in the DB already
			Url.findOne({ "originalUrl" : originalUrl }, function(err, url) {
				// if err, send it
				if (err) {
					res.json({"error" : "There has been an error"});
				}
				// if url is null create entry in db
				if (!url) {
					// get current amount of entries
					Url.count({}, function(err, c) {
						// add 1 to current amount of entries for saving the next entry with the correct id
						id = c + 1;
						// create obj
						url = { "id" : id, "originalUrl" : originalUrl, "shortUrl" : req.headers.host + "/url/" + id};
						// save obj
						Url.create(url, function(err, url) {
							if (err) {
								res.json({"error" : "There has been an error"});
							}
							// return json to user
							res.json({"original url" : url.originalUrl, "short url" : url.shortUrl});
						});
					});
				} else {
					// if url in DB, send result
					res.json({"original url" : url.originalUrl, "short url" : url.shortUrl});
				}
			});
		}
	});

	// get id and redirect to page
	app.get('/url/*', function(req, res, next) {
		var id = req.params[0];
		// if id is not an integer, then return
		if (id % 1 !== 0) {
			res.json({"error":"not a valid url"});
		} else {
			// else find the entry in DB using the ID and redirect to the shortUrl property of the returned obj
			Url.findOne({ id : id }, function(err, url) {
				// if err, send it
				if (err) {
					res.json({"error" : "There has been an error"});
				}
				// if ID found in DB, redirect
				res.redirect(url.originalUrl);
			});
		}
	});


	//#################################################
	// default view index.html
	app.get('/*', function(req, res, next) {
		res.redirect('index.html');
	});



};
