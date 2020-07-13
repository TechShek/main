var passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy,
  FacebookStrategy = require('passport-facebook').Strategy,
  TwitterStrategy = require('passport-twitter').Strategy,
  GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
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
      if (!user.password) return done(null, false, {
        message: `You have already signed up using social media login.`
      })
      bcrypt.compare(password, user.password, (err, isMatch) => {
        console.log(err);
        if (err) return done(null, false, {
          message: 'Something wrong.'
        });
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
    callbackURL: process.env.URL_LINK + "/auth/facebook/callback",
  },
  function(accessToken, refreshToken, profile, done) {

    let url = "https://graph.facebook.com/v3.2/me?" +
      "fields=id,name,email,first_name,last_name,picture&access_token=" + accessToken;

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
            picture: body.picture.data.url,
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
    callbackURL: process.env.URL_LINK + "/auth/twitter/callback",
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
          email: body.emails && body.emails[0].value || '',
          username: body.username,
          provider: 'twitter',
          picture: body.photos[0].value,
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

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.URL_LINK + "/auth/google/callback",
  },
  function(accessToken, refreshToken, profile, done) {
    console.log(profile);

    User.findOne({
      'google.id': profile.id
    }, function(err, user) {

      if (err) {
        console.log(err);
        return done(err);
      }
      //No user was found... so create a new user with values from Facebook (all the profile. stuff)
      if (!user) {
        user = new User({
          name: profile.displayName,
          email: profile.emails && profile.emails[0].value || '',
          username: profile.displayName,
          provider: 'google',
          picture: profile.photos[0].value,
          //now in the future searching on User.findOne({'facebook.id': profile.id } will match because of this next line
          google: profile
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
