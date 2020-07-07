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
    minlength: 3,
  },
  password: {
    type: String,
  },
  provider: {
    type: String
  },
  facebook: {
    type: Object
  },
  twitter: {
    type: Object
  }
});


var User = mongoose.model('Users', UsersSchema);

module.exports = {User};
