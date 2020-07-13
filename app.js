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
  calendar
} = require('./config/calendar')
const {
  mongoose
} = require('./db/mongoose');
const {
  passport
} = require('./config/passport');
const {
  User
} = require('./models/users');
const {
  Events
} = require('./models/events');
const {
  Topics
} = require('./models/topics');
const {
  uploadCloudinary
} = require('./config/cloudinary');



// CONFIG ===========

var app = express();
var port = process.env.PORT || 3000;

app.use(express.static(__dirname + 'public'));
app.use(bodyParser.json({
  parameterLimit: '1000000'
}));
app.use(bodyParser.urlencoded({
  parameterLimit: '1000000',
  extended: true
}));
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

hbs.registerHelper("break", function(value, options) {
  if (!value) return '';
  return value.reduce((total, val) => {
    total = total + ' ' + val.email + ' | ' + val.responseStatus + ' <br> ';
    return total;
  }, '');
})

hbs.registerHelper("match", function(value1, value2, options) {
  console.log({
    value1,
    value2
  });
  if (!value1 || !value2) return false;
  return value1.toString() == value2.toString();
});

hbs.registerHelper("add", function(value1, value2, options) {
  return Number(value1) + Number(value2);
});

hbs.registerHelper("sub", function(value1, value2, options) {
  if (value1 < value2) return 0;
  return Number(value2) - Number(value1);
});

hbs.registerHelper("moreThan", function(value1, value2, options) {
  console.log({
    value1,
    value2
  });
  console.log(Number(value1) > Number(value2));
  return Number(value1) > Number(value2);
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
                  `Thanks ${user.name} your account has been created.`
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

// TWITTER LOGIN ROUTE ==========

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

// TWITTER LOGIN ROUTE ==========

app.get('/auth/google',
  passport.authenticate('google', {
    scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
    ]
  }));

app.get('/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login',
    successRedirect: '/home',
    failureFlash: true
  }));

// NORMAL ROUTES ============

app.get('/home', authenticate, (req, res) => {
  res.render('home.hbs', {
    name: req.user.name
  })
})

app.get('/events', authenticate, (req, res) => {
  let skip = Math.abs(req.query.skip) || 0;
  Promise.all([
      Events.find({}).skip(skip).limit(10),
      Events.count({})
    ])
    .then(val => {
      res.render('events.hbs', {
        val: val[0],
        skip: skip,
        count: val[1],
      })
    })
    .catch(e => {
      req.flash('error_msg', e);
      return res.redirect('/error.hbs');
    });
})

app.get('/newtopic', authenticate, (req, res) => {
  res.render('newtopic.hbs', {
    user: req.user,
    id: new Date().getTime(),
  })
})

app.post('/newtopic', authenticate, (req, res) => {
  if (req.body.heading == '' || req.body.post == '') return res.status(200).render('newtopic.hbs', {
    user: req.user,
    error: 'Please fill in all the fields to make this request',
    heading: req.body.heading,
    post: req.body.post
  })
  console.log(req.body);
  Topics.findOneAndUpdate({
      "topic.id": req.body.id
    }, {
      topic: {
        id: req.body.id,
        user: req.user._id,
        heading: req.body.heading,
        post: req.body.post
      }
    }, {
      upsert: true,
      new: true
    }).then(val => res.redirect('/discussions'))
    .catch(e => {
      return res.status(200).render('newtopic.hbs', {
        user: req.user,
        error: e,
        heading: req.body.heading,
        post: req.body.post
      })
    })
})

app.get('/edittopic', authenticate, (req, res) => {
  Topics.findOne({
    'topic.id': req.query.id,
    'topic.user': req.user._id
  }).then(val => {
    if (!val) return Promise.reject('This topic is broken');
    return res.render('newtopic.hbs', {
      user: req.user,
      id: req.query.id,
      heading: val.topic.heading,
      post: val.topic.post
    })
  }).catch(e => res.render('error.hbs', {
    error: e
  }))
})

app.get('/deletetopic', authenticate, (req, res) => {
  Topics.deleteOne({
    'topic.id': req.query.id,
    'topic.user': req.user._id
  }).then(val => {
    if (val.n == 0) {
      req.flash('error_msg', 'This topic is broken. Contact admin.');
      return res.redirect('/discussions');
    };
    console.log(val);
    req.flash('success_msg', 'Topic successfully deleted.');
    return res.redirect('/discussions');
  }).catch(e => res.render('error.hbs', {
    error: e
  }))
})

app.get('/showtopic', authenticate, (req, res) => {
  Topics.findOne({
      "topic.id": req.query.id
    }).lean()
    .then(val => {
      req.topic = val;
      req.topic.created = new Date(Number(val.topic.id)).toString();
      return User.findOne({
        _id: val.topic.user
      })
    })
    .then(val => res.status(200).render('showtopic', {
      data: req.topic,
      user: val
    }))
    .catch(e => res.status(200).render('error.hbs', {
      error: e
    }))
})

app.get('/profile', authenticate, (req, res) => {
  res.render('profile.hbs', {
    user: req.user
  })
})

app.get('/edit_profile', authenticate, (req, res) => {
  res.render('edit_profile.hbs', {
    user: req.user
  })
})

app.post('/img_upload', authenticate, (req, res) => {
  uploadCloudinary(req.body.blah, req.user._id)
    .then(val => {
      return User.findOneAndUpdate({
        _id: req.user._id
      }, {
        cloudinary: val,
        picture: val.url
      }, {
        new: true
      });
    })
    .then(val => res.status(200).send({
      picture: val.picture
    }))
    .catch(e => {
      console.log(e);
      res.status(300).send(e)
    });

})

app.post('/edit_profile', authenticate, (req, res) => {
  // if password does not match give error

  if (req.body.password != req.body.password2) {
    req.flash(
      'error_msg',
      `Sorry passwords do not match.`
    );
    return res.redirect('/edit_profile');
  }

  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(req.body.password, salt, (err, hash) => {
      if (err) throw err;
      User.findOneAndUpdate({
          _id: req.user._id
        }, {
          img_url: req.body.img_url,
          name: req.body.name,
          email: req.body.email,
          password: hash,
        }, {
          new: true
        }).then(val => {
          req.flash(
            'success_msg',
            `Great ${val.name} ! Your profile has been updated.`
          );
          res.redirect('/profile')
        })
        .catch(err => {
          req.flash(
            'error_msg',
            `Sorry passwords do not match.`
          );
          return res.redirect('/edit_profile');
        });
    });
  });
})

app.get('/discussions', authenticate, (req, res) => {
  Topics.find().then(val => {
    return res.render('discussions.hbs', {
      user: req.user,
      topics: val
    })
  }).catch(e => res.render('discussions.hbs', {
    user: req.user,
    error: e
  }))

})

app.get('/logout', (req, res) => {
  req.logout();
  req.flash('success_msg', 'You are logged out');
  res.redirect('/');
});

// AdmIN Level operations

app.get('/admin', authenticate, (req, res) => {
  Promise.all([
      Events.find(),
      Topics.find()
    ])
    .then(val => {
      console.log(val[1]);
      return res.render('admin.hbs', {
        events: val[0],
        topics: val[1]
      })
    })
    .catch(e => {
      res.render('error.hbs', {
        error: e
      })
    })
})

app.get('/fetch_events', authenticate, (req, res) => {
  Events.findOne({}, {}, {
    sort: {
      "event.start.dateTime": -1
    }
  }).then(val => {
    console.log((new Date('1 Jan 2020')).toISOString());
    if (!val) return calendar({
      date: (new Date('1 Jan 2020')).toISOString()
    })
    console.log((new Date(val.event.start.dateTime)).toISOString());
    return calendar({
      date: (new Date(val.event.start.dateTime)).toISOString()
    })
  }).then(val => {
    res.status(200).send(val);
  }).catch(e => {
    console.log(e);
    res.status(400).send(e);
  });
})

app.post('/save_events', authenticate, (req, res) => {
  req.body.data.map(val => console.log(val.id));
  Promise.all(req.body.data.map(val => Events.findOneAndUpdate({
    "event.id": val.id
  }, {
    event: val
  }, {
    upsert: true,
    new: true
  }))).then(val => {
    console.log(val);
    res.status(200).send(val);
  }).catch(e => res.status(400).send(e));
  // Events.insertMany(req.body.data).then(val => res.status(200).send(val)).catch(e => res.status(400).send(e));
})

app.post('/wash_events', authenticate, (req, res) => {
  Events.remove({}).then(val => res.status(200).send(val)).catch(e => res.status(400).send(e));
})

app.get('/deleteTopicSuper', authenticate, (req, res) => {
  Topics.deleteOne({
    "_id": req.query.id,
  }).then(val => {
    console.log(val);
    if (val.n == 0) return Promise.reject('Failed to delete this topic');
    req.flash('success_msg', 'successfully deleted this topic');
    return res.redirect('/admin');
  }).catch(e => {
    req.flash('error_msg', JSON.stringify(e));
    return res.redirect('/admin');
  })
})

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
