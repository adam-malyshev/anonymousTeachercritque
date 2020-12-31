const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const path = require('path');
const url = require('url');
const public = {
	root:path.join(__dirname,'..','/public')
};

const Class = require('../models/class');
const Post = require('../models/post');

function findClass( id, cb ){
    //cb is (err, result)
    Class
        .findById(id)
        .exec()
        .then( result => {
            console.log("Result is:", result);
            cb(null, result);
        })
        .catch(err => {
            cb(err, null);
        });
}

router.get('/', require('connect-ensure-login').ensureLoggedIn(), (req, res) => {
    const params = url.parse(req.url, true).query;
    const classId = params.classId;
    findClass(classId, (err, data) => {
        if(err){
            console.log(err);
            return res.status(500).redirect('/classes');
        }
        if(req.user._id.toString() == data.administrator._id.toString()){
            return res.status(200).sendFile('./teacherClass.html', public, (err) => {
                    if(err) throw err;
                });
        }else{
            return res.status(200).sendFile('./studentClass.html', public, (err) => {
                    if(err) throw err;
                });
        }
    });
});

async function InClass(userId, classObj){
    if(userId == classObj.administrator._id){
        return true;
    }
    for(const students of classObj.students){
        if(userId == students._id){
            return true;
        }
    }
    return false;
}

router.get('/posts', require('connect-ensure-login').ensureLoggedIn(), (req, res) => {
    const params = url.parse(req.url, true).query;
    const classId = params.classId;
    console.log('classId:',classId);
    findClass(classId, async (err, data) => {
        if(err){
            console.log(err);
            res.status(500).redirect('/class?classId=' + classId);
        }
        if(!InClass(req.user._id.toString(), data)){
            res.status(500).redirect('/class?classId=' + classId);
        }else{
            Post
                .find({ 'class._id':classId})
                .sort('-time')
                .select('_id message time class')
                .exec()
                .then(results => {
                    console.log("THis is results: ", results);
                    res.status(200).json(results);
                })
                .catch(err => {
                    console.log(err);
                    res.status(500).redirect('/class?classId=' + classId);
                });
        }
    });
});



router.post('/posts', require('connect-ensure-login').ensureLoggedIn(), (req, res) => {
    const params = url.parse(req.url, true).query;
    const classId = params.classId;
    findClass(classId, (err, data) => {
        if(err){
            console.log(err);
            res.status(500).redirect(req.url);
        }
        if(!InClass(req.user._id.toString(), data)){
            res.status(500).redirect(req.url);
        }else{
            const newpost = new Post({
                _id: new mongoose.Types.ObjectId(),
                message:req.body.message,
                time: new Date().getTime(),
                author:{
                    _id:req.user._id,
                    email:req.user.email
                },
                class:{
                    _id:classId,
                    name:data.name,
                    administrator:{
                        _id:data.administrator._id,
                        email:data.administrator.email
                    }
                }
            });

            newpost
                .save()
                .then(result => {
                    console.log("Posting: ", result);
                    res.status(200).redirect('/class?classId=' + classId);
                })
                .catch(err => {
                    console.log(err);
                    res.status(500).redirect('/class?classId=' + classId);
                });
        }
    });


});


module.exports = router;
