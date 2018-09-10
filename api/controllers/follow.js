'use strict'

var path = require('path');
var fs = require('fs');
var mongoosePaginate = require('mongoose-pagination');

var User = require('../models/user');
var Follow = require('../models/follow');


function saveFollow(req,res){
    var params = req.body;
    var follow = new Follow();

    follow.user = req.user.sub;
    follow.followed = params.followed;

    follow.save((err, followStored) => {
        if(err) return res.status(500).send({message:'Error al guardar followed'});
        if(err) return res.status(404).send({message:'No se ha guardado followed'});

        return res.status(200).send({
            follow:followStored
        });
    });

}


function deleteFollow(req, res){

    var userId = req.user.sub;
    var followId = req.params.id;

    Follow.find({user:userId, followed:followId}).remove((err) => {
        if(err) return res.status(500).send({message:'Error al borrar el follow'});

        return res.status(200).send({
            message:'Se ha eliminado el follow'
        });
    });

}

// Lista de usuarios a quien userId esta siguiendo
function getFollowingUsers(req,res){
    var userId = req.user.sub;
    var page = 1;
    var itemsPerPage = 4;

        if(req.params.id && req.params.id){
            userId = req.params.id;
        }

        if(req.params.page){
            page = req.params.page;
        }

    Follow.find({user: userId}).populate({path:'followed'}).paginate(page,itemsPerPage, (err,follows, total) => {
        if(err) return res.status(500).send({message:'Error al listar'});

        if(!follows) return res.status(404).send({message:'No estas siguiendo a ningun usuario'});

        return res.status(200).send({
            total: total,
            pages : Math.ceil(total/itemsPerPage),
            follows
        });

    });

}


// Lista de usuarios que siguen a userId
function getFollowedUsers(req,res){
    var userId = req.user.sub;
    var page = 1;
    var itemsPerPage = 4;

        if(req.params.id && req.params.id){
            userId = req.params.id;
        }

        if(req.params.page){
            page = req.params.page;
        }

    Follow.find({followed: userId}).populate('user').paginate(page,itemsPerPage, (err,follows, total) => {
        if(err) return res.status(500).send({message:'Error al listar'});

        if(!follows) return res.status(404).send({message:'No te sigue ningun usuario'});

        return res.status(200).send({
            total: total,
            pages : Math.ceil(total/itemsPerPage),
            follows
        });

    });

}

// Devolver listado de usuarios pin paginar
// Seguidores o seguidos de logued user
function getMyFollows(req,res){
    var userId = req.user.sub;

    var find = Follow.find({user: userId});
    if(req.params.followed){
        find = Follow.find({followed: userId});
    }

    find.populate('user followed').exec( (err, follows) => {
        if(err) return res.status(500).send({message:'Error al listar'});

        if(!follows) return res.status(404).send({message:'No te sigue ningun usuario'});

        return res.status(200).send({
            follows
        });
    });

}



module.exports = {
    saveFollow,
    deleteFollow,
    getFollowingUsers,
    getFollowedUsers,
    getMyFollows
}