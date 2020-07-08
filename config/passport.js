var passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy,
  FacebookStrategy = require('passport-facebook').Strategy,
  TwitterStrategy = require('passport-twitter').Strategy,
  {
    User
  } = require('../models/users'),
  bcrypt = require('bcryptjs'),
  request = require('request');

passport.use(new LocalStrategy(
  function(username, password, done) {
    User.findOne({
      email: username
    }, function(err, user) {
      if (err) {
        return done(err);
      }
      if (!user) {
        return done(null, false, {
          message: 'Incorrect username.'
        });
      }
      // Match password
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) throw err;
        if (isMatch) {
          return done(null, user);
        } else {
          return done(null, false, {
            message: 'Password incorrect'
          });
        }
      });
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook",
  },
  function(accessToken, refreshToken, profile, done) {

    let url = "https://graph.facebook.com/v3.2/me?" +
      "fields=id,name,email,first_name,last_name&access_token=" + refreshToken;

    return request({
      url: url,
      json: true
    }, function(err, response, body) {

      if (body.error) {
        console.log(err);
        return done(body.error.message);
      }

      User.findOne({
        'facebook.id': body.id
      }, function(err, user) {

        if (err) {
          console.log(err);
          return done(err);
        }
        //No user was found... so create a new user with values from Facebook (all the profile. stuff)
        if (!user) {
          user = new User({
            name: body.name,
            email: body.email,
            username: body.email,
            provider: 'facebook',
            //now in the future searching on User.findOne({'facebook.id': profile.id } will match because of this next line
            facebook: body
          });
          user.save(function(err) {
            if (err) console.log(err);
            return done(err, user);
          });
        } else {
          //found user. Return
          return done(err, user);
        }
      });
    });
  }
));

passport.use(new TwitterStrategy({
    consumerKey: process.env.TWITTER_CONSUMER_KEY,
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
    callbackURL: "http://localhost:3000/auth/twitter",
    userProfileURL: "https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true",
  },
  function(token, tokenSecret, body, done) {

    console.log(body);

    User.findOne({
      'twitter.id': body.id
    }, function(err, user) {

      if (err) {
        console.log(err);
        return done(err);
      }
      //No user was found... so create a new user with values from Facebook (all the profile. stuff)
      if (!user) {
        user = new User({
          name: body.displayName,
          email: body.emails[0].value,
          username: body.username,
          provider: 'twitter',
          //now in the future searching on User.findOne({'facebook.id': profile.id } will match because of this next line
          twitter: body
        });
        user.save(function(err) {
          if (err) console.log(err);
          return done(err, user);
        });
      } else {
        //found user. Return
        return done(err, user);
      }
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    if (err) done(null, false, {
      message: 'Failed to deserializeUser'
    })
    done(err, user);
  }).catch(e => done(null, false, {
    message: 'Failed to deserializeUser'
  }));
});



module.exports = {
  passport
}