const mongoose = require('mongoose');

var EventsSchema = new mongoose.Schema({
  event: {
    type: Object,
    required: true
  }
});


var Events = mongoose.model('Events', EventsSchema);

module.exports = {Events};
