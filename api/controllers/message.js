'use strict'


var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');

var User = require('../models/user');
var Follow = require('../models/follow');
var Message = require('../models/Message');


function saveMessage(req,res){
    var params = req.body;
    if(!params.text || !params.receiver){
        return res.status(200).send({message:'Todos los campos son necesarios'})
    }

    var message = new Message();

    message.emitter = req.user.sub;
    message.receiver = params.receiver;
    message.text = params.text;
    message.created_at = moment().unix();
    message.viewed = false;

    message.save((err,messageStored) => {
        if(err) return res.status(500).send({message:'Error en la peticion.'});
        if(!messageStored) return res.status(500).send({message:'Error al guardar mensaje.'});
    
        return res.status(200).send({message: messageStored});
    
    });
}

function getReceivedMessages(req, res){
    var userId = req.user.sub;
    var itemsPerPage = 2;

    var page = 1
    if(req.params.page){
        page = req.params.page;
    }

    Message.find({'receiver': userId}).populate('emitter','name surname _id nick image').paginate(page, itemsPerPage, (err, messages, total) =>{
        if(err) return res.status(500).send({message:'Error en la peticion.'});
        if(!messages) return res.status(404).send({message:'No hay mensages.'});
        console.log(messages);
        return res.status(200).send({
            total: total,
            pages: Math.ceil(total / itemsPerPage),
            messages: messages
        })
    });
}

function getEmmitedMessages(req, res){
    var userId = req.user.sub;
    var itemsPerPage = 2;

    var page = 1
    if(req.params.page){
        page = req.params.page;
    }

    Message.find({'emitter': userId}).populate('emitter receiver','name surname _id nick image').paginate(page, itemsPerPage, (err, messages, total) =>{
        if(err) return res.status(500).send({message:'Error en la peticion.'});
        if(!messages) return res.status(404).send({message:'No hay mensages.'});
        console.log(messages);
        return res.status(200).send({
            total: total,
            pages: Math.ceil(total / itemsPerPage),
            messages: messages
        })
    });
}

function getUnviewedMessages(req, res){
    var userId = req.user.sub;

    Message.countDocuments({receiver: userId, viewed: 'false'}).then( (count) => {
        //if(err) handleError(err);
        return res.status(200).send({
            'unviewed':count
        })
    });
}

function setViewedMessages(req,res){
    var userId = req.user.sub;
    Message.update({receiver: userId, viewed: 'false'}, {viewed: 'true'}, {"multi": true}, (err, messagesUpdated) =>{
        if(err) return res.status(500).send({message:'Error en la peticion.'});
        return res.status(200).send({
            messages:messagesUpdated
        });
    });
}

module.exports = {
    saveMessage,
    getReceivedMessages,
    getEmmitedMessages,
    getUnviewedMessages,
    setViewedMessages
    
}