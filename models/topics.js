const mongoose = require('mongoose');

var TopicsSchema = new mongoose.Schema({
  topic: {
    type: Object,
    required: true
  }
});


var Topics = mongoose.model('Topics', TopicsSchema);

module.exports = {Topics};
