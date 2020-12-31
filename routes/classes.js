const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const path = require('path');
const public = {
	root:path.join(__dirname,'..','/public')
};


const Class = require('../models/class');
const Post = require('../models/post');
router.get('/', require('connect-ensure-login').ensureLoggedIn(), (req,res) => {
    res.status(200).sendFile('./classes.html', public, (err) => {
		if(err) throw err;
	});
});

router.get('/createclass', require('connect-ensure-login').ensureLoggedIn(), (req, res) => {
    res.status(200).sendFile('./newclass.html', public, (err) => {
		if(err) throw err;
	});
});
router.post('/createclass', require('connect-ensure-login').ensureLoggedIn(), (req, res) => {
    console.log(req.body.name);
    const newclass = new Class({
        _id: new mongoose.Types.ObjectId(),
        name:req.body.name,
        administrator:{
            _id:req.user._id,
            email:req.user.email
        },
        students:[]
    });
    newclass
        .save()
        .then(result => {
            console.log(result);
            res.status(201).redirect('/classes');
        })
        .catch(err => {
            console.log(err);
            res.status(500).redirect('/classes/createclass')
        });
});


router.get('/joinclass', require('connect-ensure-login').ensureLoggedIn(), (req,res) => {
    res.status(200).sendFile('./joinclass.html', public, (err) => {
		if(err) throw err;
	});
});

router.post('/joinclass', require('connect-ensure-login').ensureLoggedIn(), (req,res) => {
    findClass(req.body.code , (err, data) => {
        if(err){
            console.log(err);
            return res.status(500).redirect('/classes/joinclass');
        }
        console.log("ID:", req.user._id);
        console.log("Admin ID:", data.administrator._id)
        console.log(req.user._id.toString() == data.administrator._id.toString() );
        if(req.user._id.toString() == data.administrator._id.toString() ){
            console.log(new Error("Cannot join class you are administrator of"));
            return res.status(500).redirect('/classes/joinclass');
        }
        console.log(data);
        data.students.push({
            _id: req.user._id,
            email: req.user.email
        });
        data.save()
            .then(result => {
                res.status(201).redirect('/classes');
            })
            .catch(err => {
                console.log(err);
                res.status(500).redirect('/classes/joinclass');
            });
    });
});

router.get('/getTeacherClasses', require('connect-ensure-login').ensureLoggedIn(), (req, res) => {
    Class
        .find({ administrator:{_id:req.user._id, email:req.user.email}/*,  students:[{_id:req.user._id, email:req.user.email}]*/})
        .exec()
        .then(results => {
            console.log(results);
            res.status(200).json(results);
        })
        .catch(err => {
            res.status(500).redirect('/classes');
        });
});

router.get('/getStudentClasses', require('connect-ensure-login').ensureLoggedIn(), (req, res) => {
    Class
        .find({students:[{_id:req.user._id, email:req.user.email}]})
        .exec()
        .then(results => {
            console.log(results);
            res.status(200).json(results);
        })
        .catch(err => {
            res.status(500).redirect('/classes');
        });
});


module.exports = router;
