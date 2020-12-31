const express = require('express');
const app = express();

const morgan = require('morgan');
const bodyParser = require('body-parser');
const path = require('path');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const session = require("express-session");
const options = {
	root:path.join(__dirname,'public')
};

const classesRoutes = require('./routes/classes');
const classRoutes = require('./routes/class');
const uri = 'mongodb+srv://Admin:5X2ajiyCuCbcPYcC@cluster0.na0di.mongodb.net/CoolDb?retryWrites=true&w=majority';
mongoose.connect(
    uri,
	{ useUnifiedTopology: true, useNewUrlParser: true }
);

const connection = mongoose.connection;

connection.on('error', console.error.bind(console, 'connection error:'));
connection.once("open", function() {
  console.log("MongoDB database connection established successfully");
});

mongoose.Promise = global.Promise;
// db.on('error', console.error.bind(console, 'connection error:'));
// db.once('open', () => {
//   // we're connected!
//   console.log("Db connected");
// });

const User = require('./models/user');

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));

app.use(session({secret:"keyboard cat", resave:"false", saveUninitialized: false}));



findById = function(id, cb) {
  process.nextTick(function() {
	  User.findById(id)
	  	.exec()
		.then( doc => {
			console.log("From Db", doc);
			if(doc){
				return cb(null, doc);
			}else{
				return cb(new Error('User ' + id + ' does not exist'), null);
			}
		})
		.catch(err => {
			console.log(err);
			return cb(new Error('User ' + id + ' does not exist'), null);
		});
  });
}

findByEmail = function(username, cb) {
   process.nextTick(function() {
	   User
		.findOne({
			"email":username
		})
		.exec()
		.then( doc => {
			console.log("From Db", doc);
			if(doc){
				return cb(null, doc);
			}else{
				return cb(null, null);
			}
		})
		.catch(err => {
			console.log(err);
			return cb(null, null);
		});
   });
}

passport.use(new LocalStrategy(
	{
		usernameField: 'email',
    	passwordField: 'password'
	},
	function(email, password, done) {
    User
		.findOne({
			'email':email
		})
		.exec()
		.then( user => {
			if(!user) {
				return done(null, false, { message: 'Incorrect username.' });
			}
			if(user.password != password){
				return done(null, false, { message: 'Incorrect password.' });
			}
			return done(null, user);
		})
		.catch(err => {
			if (err) {
				return done(err)
			};
		});
	}
));


passport.serializeUser(function(user, done) {
	console.log("serialized USer");
	done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User
  	.findById(id)
	.exec()
	.then( user  => {
		if(user){
			done(null, user);
		}else{
			done(new Error('User ' + id + ' does not exist'), null);
		}
	})
	.catch(err => {
		console.log(err);
		done(err, null);
	});
});

app.use(passport.initialize());
app.use(passport.session());


app.get('/', (req, res) => {
    res.sendFile("./welcome.html", options, (err) => {
        if (err) throw err;
    });
});

app.get('/register', (req, res) => {
    res.sendFile("./register.html", options, (err) => {
        if(err) throw err;
    });
});

app.get('/login', (req, res) => {
    res.sendFile("./login.html", options, (err) => {
        if (err) throw err;
    });
});

app.post('/login', passport.authenticate('local', { successRedirect: '/classes', failureRedirect: '/login' }));

app.post('/register', (req, res) => {
	const user = new User({
		_id: new mongoose.Types.ObjectId(),
        email: req.body.email,
        password: req.body.password
	});

	user
		.save()
		.then(result => {
			console.log(result);
			res.status(201).redirect('/login');
		})
		.catch(err => {
			console.log("Error:",err);
			res.status(500).redirect('/register');
		});
});

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

app.use('/classes', classesRoutes);
app.use('/class', classRoutes);
module.exports = app;
