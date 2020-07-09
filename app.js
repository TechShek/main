require('./config/config');

const http = require('http');
const reload = require('reload');
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const bodyParser = require('body-parser');
const hbs = require('hbs');
const flash = require('connect-flash');
const bcrypt = require('bcryptjs');
var cookieParser = require('cookie-parser')

const {
  mongoose
} = require('./db/mongoose');
const {
  passport
} = require('./config/passport');
const {
  User
} = require('./models/users');

// CONFIG ===========

var app = express();
var port = process.env.PORT || 3000;

app.use(express.static(__dirname + 'public'));
app.use(cookieParser());
app.use(bodyParser.json({
  limit: '50mb'
}));
app.use(bodyParser.urlencoded({
  limit: '50mb',
  extended: true
}));
app.use(session({
  secret: process.env.sessionSecret,
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 20 * 60 * 1000,
  },
  rolling: true,
  store: new MongoStore({
    mongooseConnection: mongoose.connection
  })
}))
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

app.use(function(req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

app.use(function(req, res, next) {
  if (!req.session.due) req.session.due = [];
  if (req.headers.accept != process.env.test_call) console.log('SESSION STATE', Object.keys(req.session));
  next();
});

app.set('view engine', 'hbs');

// hbs =============

hbs.registerPartials(__dirname + '/views/partials');
hbs.registerHelper("inc", function(value, options) {
  return parseInt(value) + 1;
});

// authenticate ===========

let authenticate = function(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error_msg', 'Please log in to view that resource');
  res.redirect('/login');
}

// ROUTES =========

app.get('/', (req, res) => {
  console.log(req.user);
  let data = [{
      event: 'Meeting with Sana Nadeem',
      host: 'Qasim Ali',
      invitees: [{
          name: 'Sana Nadeem',
          details: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
        },
        {
          name: 'Ahmed Ali',
          details: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
        }
      ],
      time: '1000 hrs to 1100 hrs Pakistan Standard Time',
      status: 'Completed',
      summary: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
    },
    {
      event: 'Meeting with Akash',
      host: 'Qasim Ali',
      invitees: [{
        name: 'Akash',
        details: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
      }]
    }
  ]
  res.render('index.hbs', {
    data: data
  });
})

app.get('/login', (req, res) => {
  res.render('login.hbs');
})

app.post('/login', passport.authenticate('local', {
  successRedirect: '/home',
  failureRedirect: '/login',
  failureFlash: true
}));

app.get('/register', (req, res) => {
  res.render('register.hbs');
})

app.post('/register', (req, res) => {
  const {
    name,
    email,
    password,
    password2
  } = req.body;

  let errors = [];

  if (!name || !email || !password || !password2) {
    errors.push({
      msg: 'Please enter all fields'
    });
  }

  if (password != password2) {
    errors.push({
      msg: 'Passwords do not match'
    });
  }

  if (password.length < 6) {
    errors.push({
      msg: 'Password must be at least 6 characters'
    });
  }

  if (errors.length > 0) {
    res.render('register', {
      errors,
      name,
      email,
      password,
      password2
    });
  } else {
    User.findOne({
      email: email
    }).then(user => {
      if (user) {
        errors.push({
          msg: 'Email already exists'
        });
        res.render('register', {
          errors,
          name,
          email,
          password,
          password2
        });
      } else {
        const newUser = new User({
          name,
          email,
          password
        });

        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            newUser
              .save()
              .then(user => {
                req.flash(
                  'success_msg',
                  `Thanks ${user.name} your account has been created. Please log in to explore Techshek.`
                );
                res.redirect('/login');
              })
              .catch(err => console.log(err));
          });
        });
      }
    });
  }
})

// FACEBOOK LOGIN ROUTE ==========

app.get('/auth/facebook',
  passport.authenticate('facebook', {
    successRedirect: '/home',
    failureRedirect: '/login',
    failureFlash: true
  }));

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', {
    successRedirect: '/home',
    failureRedirect: '/login',
    failureFlash: true
  }));

// FACEBOOK LOGIN ROUTE ==========

app.get('/auth/twitter',
  passport.authenticate('twitter', {
    successRedirect: '/home',
    failureRedirect: '/login',
    failureFlash: true
  }));

app.get('/auth/twitter/callback',
  passport.authenticate('twitter', {
    failureRedirect: '/login',
    successRedirect: '/home',
    failureFlash: true
  }))

// NORMAL ROUTES ============

app.get('/home', authenticate, (req, res) => {
  res.render('home', {
    name: req.user.name
  })
})

app.get('/logout', (req, res) => {
  req.logout();
  req.flash('success_msg', 'You are logged out');
  res.redirect('/');
});

var port = process.env.PORT || 3000;


app.set('port', process.env.PORT || 3000);
var server = http.createServer(app);

// Reload code here
reload(app).then(function(reloadReturned) {
  server.listen(app.get('port'), function() {
    console.log('Web server listening on port ' + app.get('port'))
  })
}).catch(function(err) {
  console.error('Reload could not start, could not start server/sample app', err);
});
