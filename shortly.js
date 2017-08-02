var express = require('express');
var session = require('express-session');
var util = require('./lib/utility');
var partials = require('express-partials');
var bcrypt = require('bcrypt-nodejs');
var bodyParser = require('body-parser');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.use(session({
  secret: 'unicornKiller',
  resave: false,
  saveUninitialized: false
}));


app.get('/',
function(req, res) {
  restrict(req, res, function() {
    //console.log('homepage session', req.session);
    res.render('index');
  });
});

app.get('/login', function (req, res) {
  //console.log('login session', req.session);
  res.render('login');
});


app.get('/logout', function(req, res) {
  req.session.destroy(function() {
    res.redirect('/login');
  });
});

app.get('/create',
function(req, res) {
  restrict(req, res, function() {
    res.render('index');
  });
});

app.get('/signup',
function(req, res) {
  res.render('signup');
});

app.get('/links',
function(req, res) {
  restrict(req, res, function() {
    Links.reset().fetch().then(function(links) {
      res.status(200).send(links.models);
    });
  });
});

app.post('/links',
function(req, res) {

  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.sendStatus(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.status(200).send(found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.sendStatus(404);
        }

        Links.create({
          url: uri,
          title: title,
          baseUrl: req.headers.origin
        })
        .then(function(newLink) {
          res.status(200).send(newLink);
        });
      });
    }
  });
});


/************************************************************/
// Write your authentication routes here
/************************************************************/
function restrict(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    req.session.error = 'Access denied!';
    res.redirect('/login');
  }
}

app.post('/login',
  function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    if (!username || !password) {
      res.sendStatus(404);
    } else {
      new User({
        username: username
      }).fetch().then(function (found) {
        if (!found) {
          res.redirect('/login');
        } else {
          bcrypt.compare(password, this.get('password'), function(err, match) {
            if (match) {
              req.session.user = username;
              res.redirect('/');
            } else {
              res.redirect('/');
            }
          });
        }
      });
    }
  });

app.post('/signup',
function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  if (!username || !password) {
    console.log('username or password is not valid');
    res.sendStatus(404);
  } else {
    new User({
      username: username
    }).fetch().then(function (found) {
      if (found) {
        console.log('Username has been taken');
        //res.status(200).send('Username taken');  //username taken
        res.redirect('/signup');
      } else {
        bcrypt.hash(password, null, null, function(err, hash) {
          Users.create({
            username: username,
            password: hash
          })
          .then(function () {
            req.session.regenerate(function() {
              req.session.user = username;
              res.redirect('/');
            });
          });
        });
      }
    });
  }
});

//
/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        linkId: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits') + 1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

module.exports = app;
