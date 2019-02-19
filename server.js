const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const flash = require('express-flash');
const session = require('express-session');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/rentbox');
mongoose.Promise = global.Promise;

app.use(bodyParser.json());
app.use(session({
  secret: 'keyboardkitteh',
  resave: false,
  saveUninitialized: true,
}))
app.use(flash());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
})

var api = express.Router();
var auth = express.Router();

var UserSchema = new mongoose.Schema({
  first_name: { type: String, required: [true, "Please enter a first name."], minlength: [2, "minimum 2 characters"] },
  last_name: { type: String, required: [true, "Please enter a last name."], minlength: [2, "minimum 2 characters"] },
  email: { type: String, lowercase: true, required: [true, "Please enter a email."], minlength: [1, "please enter a valid email"] },
  password: { type: String, required: [true, "Please enter a password."], minlength: [8, "password minimum 8 characters"] },
  role: { type: String, default: 'user' }
}, {
    timestamps: true
  });
mongoose.model("User", UserSchema);
var User = mongoose.model("User");


auth.get('/users', function (req, res) {
  User.find({}, function (err, users) {
    res.json({ status: true, users: users });
  })
})

auth.post('/register', function (req, res) {
  var user = new User({
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    email: req.body.email,
    password: req.body.password
  });
  bcrypt.hash(user.password, saltRounds, function (err, hash) {
    user.password = hash
    user.save(function (err, user) {
      if (err) {
        for (var key in err.errors) {
          req.flash('register', err.errors[key].message);
        }
        return res.json({ status: false, error: err });
      } else {
        req.flash('success', 'You registered successfully, please login now!')
        return res.json({ status: true, user: user });
      }
    });
  });
});

auth.post('/login', function (req, res) {
  console.log('email is:' + req.body.email)

  User.findOne({ email: req.body.email }, function (err, user) {
    if (user === null) {
      return res.send(401)
    } else {
      bcrypt.compare(req.body.password, user.password, function (err, result) {
        if (result) {
          return res.json({ user: user });
        } else {
          return res.send(401)
        }
      });
    }
  });
});

app.use('/api', api);
app.use('/auth', auth);
app.listen(63145);