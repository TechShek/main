const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const session = require('express-session');

var UsersSchema = new mongoose.Schema({
  name: {
    type: String,
    minlength: 3
  },
  username: {
    type: String
  },
  email: {
    type: String,
    required: true,
    minlength: 3,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  provider: {
    type: String
  },
  facebook: {
    type: Object
  },
});


var User = mongoose.model('Users', UsersSchema);

module.exports = {User};
