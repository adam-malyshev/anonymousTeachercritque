const mongoose = require('mongoose');
const userSchema  = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    email: {type: String, required:true}
})

const classSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: {type: String, required:true},
    administrator:userSchema
});

const postSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    message:{type: String, required:true},
    time:{type:Number, required:true},
    author: userSchema,
    class: classSchema,
    likes:[userSchema]
});

module.exports = mongoose.model('Post', postSchema);
