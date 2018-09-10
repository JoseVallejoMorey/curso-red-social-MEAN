'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MessageSchema = Schema({
    'emitter': { type: Schema.ObjectId, ref: 'user'},
    'receiver': { type: Schema.ObjectId, ref: 'user'},
    'viewed': String,
    'text': String,
    'created_at': String
});


module.exports = mongoose.model('message', MessageSchema);
