var mongoose = require('mongoose');

module.exports = mongoose.model('Search', {
    "term" : String,
    "when" : String
});
