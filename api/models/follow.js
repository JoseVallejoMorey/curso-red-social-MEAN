'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var FollowSchema = Schema({
    'user': { type: Schema.ObjectId, ref: 'user'},
    'followed': { type: Schema.ObjectId, ref: 'user'}
});


module.exports = mongoose.model('follow', FollowSchema);
