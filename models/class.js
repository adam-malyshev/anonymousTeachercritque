const mongoose = require('mongoose');
const userSchema  = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    email: {type: String, required:true}
})

const classSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: {type: String, required:true},
    administrator:userSchema,
    students:[userSchema]
});

module.exports = mongoose.model('Class', classSchema);
