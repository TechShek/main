const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const session = require('express-session');

var UsersSchema = new mongoose.Schema({
  name: {
    type: String,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    minlength: 3,
    unique: true
  },
  username: {
    type: String,
  },
  sponsorAddress: {
    type: String,
  },
  mob: {
    type: String,
  },
  sponsorAccountTitle: {
    type: String,
  },
  sponsorAccountBank: {
    type: String,
  },
  sponsorAccountNo: {
    type: String,
  },
  sponsorAccountIBAN: {
    type: String,
  },
  specialNote: {
    type: String,
  },
  flag: {
    type: String,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  password: {
    type: String,
  },
  SigninType: {
    type: String,
  },
  tokens: [{
    access: {
      type: String,
      required: true,
    },
    token: {
      type: String,
      required: true,
    }
  }],
  phoneCode: {
    type: String,
  },
  wrongAttempts: {
    type: Number,
    default: 0,
  },
  attemptedTime: {
    type: Number,
    default: 0,
  },
  stripe: {
    type: Object
  }
});


var Users = mongoose.model('Users', UsersSchema);

module.exports = {Users};
