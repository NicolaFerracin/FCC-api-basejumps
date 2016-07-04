var mongoose = require('mongoose');

module.exports = mongoose.model('Url', {
  id : Number,
  originalUrl : String,
  shortUrl : String
});
