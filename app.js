require('./config/config');

const http = require('http');
const reload = require('reload');
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const bodyParser = require('body-parser');
const hbs = require('hbs');
var cookieParser = require('cookie-parser')

const {mongoose} = require('./db/mongoose');

var app = express();
var port = process.env.PORT || 3000;
app.use(express.static(__dirname+'/public'));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(cookieParser());
app.use(session({
  secret: process.env.sessionSecret,
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 20 * 60 * 1000,
  },
  rolling: true,
  store: new MongoStore({ mongooseConnection: mongoose.connection })
}))
app.set('view engine','hbs');

hbs.registerPartials(__dirname + '/views/partials');
hbs.registerHelper("inc", function(value, options) {
    return parseInt(value) + 1;
});

app.use(function(req, res, next) {
  if (!req.session.due) req.session.due = [];
  if (req.headers.accept != process.env.test_call) console.log('SESSION STATE', Object.keys(req.session));
  next();
});

let authenticate = (req,res,next) => {

};


var port = process.env.PORT || 3000;


app.set('port', process.env.PORT || 3000);
var server = http.createServer(app);

// Reload code here
reload(app).then(function (reloadReturned) {
  server.listen(app.get('port'), function () {
    console.log('Web server listening on port ' + app.get('port'))
  })
}).catch(function (err) {
  console.error('Reload could not start, could not start server/sample app', err);
});
