'use strict'

var bcrypt = require('bcrypt-nodejs');
var mongoosePaginate = require('mongoose-pagination');
var fs = require('fs');
var path = require('path');
var User = require('../models/user');
var Follow = require('../models/follow');
var Publication = require('../models/publication');
var jwt = require('../services/jwt');


// Guardar un usuario
function saveUser(req,res){
    var params = req.body;
    var user = new User();

if(params.name &&
    params.surname &&
    params.nick && 
    params.email && 
    params.password){

        user.name = params.name;
        user.surname = params.surname;
        user.email = params.email.toLowerCase();
        user.nick = params.nick;
        user.role = 'ROLE_USER';
        user.image = null;

        //Comprobamos antes de guardar el usuario que el email niel nick no existan
        User.find({ $or: [
            {email: user.email.toLowerCase()},
            {nick: user.nick.toLowerCase()}
        ]}).exec( (err, users)=>{
            if(err) return res.status(500).send({message: 'Error al guardar el usuario.'});

            if(users && users.length >= 1){
                return res.status(200).send({ message:'Ya existe ese usuario.'});
            }else{
                // Encriptar la contraseña
                bcrypt.hash(params.password, null, null, (err,hash)=>{
                    user.password = hash;

                    user.save((err, userStored) => {
                        if(err) return res.status(500).send({message: 'Error al guardar el usuario.'});

                        if(userStored){
                            res.status(200).send({
                                user: userStored
                            });
                        }else{
                            res.status(404).send({message:'No se ha registrado el usuario.'})
                        }
                    });
                });
            }
        });

    }else{
        res.status(200).send({
            message:'Todos los campos son necesarios.',
            params: params
        });
    }

}

// Login de usuario
function loginUser(req, res){
    var params = req.body;

    var email = params.email;
    var password = params.password;

    User.findOne({email: email}, (err, user) => {
        if(err) return res.status(500).send({message: 'Error al guardar el usuario.'});
        if(user){
            bcrypt.compare(password, user.password, (err, check)=>{
                if(check){
                    if(params.gettoken){
                        //devolver un token
                        //ccrearemos un servicio para generar un token
                        return res.status(200).send({
                            token: jwt.createToken({user})
                        });
                    }else{
                        //devolver datos del usuario, password no
                        user.password = undefined;
                        return res.status(200).send({user: user})                        
                    }

                }else{
                    return res.status(404).send({message: 'El usuario no se ha podido identificar.'});
                }
            });
        }else{
            return res.status(404).send({message: 'El usuario no se ha podido identificar.'});

        }
    })
}

//Obtener un usuario
function getUser(req,res){
    var userId = req.params.id;

    User.findById(userId, (err, user) => {
        if(err) return res.status(500).send({message: 'Error en la peticion.'});
        if(!user) return res.status(404).send({message: 'El usuario no existe.'});

        followThisUser(req.user.sub, userId).then((value) => {
            user.password = undefined;
            return res.status(200).send({
                user,
                following: value.following,
                followed: value.followed
            });  
        });
      
        
    });
}

//Obtener un listado de usuarios
function getUsers(req, res){
    //Al autentificar el usuario hemos guardado el objeto 
    //del usuario actual al que podemos acceder ahora
    var identity_user_id = req.user.sub;
    var page = 1
    if(req.params.page){
        page = req.params.page;
    }

    var itemsPerPage = 5;

    User.find().sort('_id').paginate(page, itemsPerPage, (err, users, total) => {
        if(err) return res.status(500).send({message: 'Error en la peticion.'});

        if(!users) return res.status(404).send({message: 'No hay usuarios.'});

        followUserIds(identity_user_id).then( (value)=> {
            return res.status(200).send({
                users,
                total,
                pages: Math.ceil(total/itemsPerPage),
                users_followers: value.followed,
                users_following: value.following
            })
        });


    });

}

//Edicion de datos de un usuario
function updateUser(req, res){
    var userId = req.params.id;
    var update = req.body;

    //borrar password si existiera
    delete update.password;

    if(userId != req.user.sub){
        return res.status(500).send({message:'No tienes permiso.'})
    }

    User.findByIdAndUpdate(userId, update, { new:true}, (err, userUpdated) => {
        if (err) return res.status(500).send({message:'Error en la peticion.'});
        if (!userUpdated) return res.status(404).send({message:'No se ha podido actualizar.'});
        
        return res.status(200).send({user: userUpdated});
    });

}

//Subir una imagen
function uploadImage(req, res){
    var userId = req.params.id;

    if(req.files){
        var filePath = req.files.image.path;
        var fileSplit = filePath.split('/');
        var fileName = fileSplit[2];
        var extSplit = fileName.split('.');
        var fileExt = extSplit[1].toLowerCase();

        if(userId != req.user.sub){
            return removeFilesOfUploads(res, filePath, 'No tienes permiso.');
        }

        if( fileExt == 'png' || 
            fileExt == 'jpg' ||
            fileExt == 'jpeg' ||
            fileExt == 'gif' ){

            User.findByIdAndUpdate(userId,{image:filePath},{new:true}, (err, userUpdated)=> {
                if (err) return res.status(500).send({message:'Error en la peticion.'});
                if (!userUpdated) return res.status(404).send({message:'No se ha podido actualizar.'});
                
                return res.status(200).send({user: userUpdated});
            });
        }else{
            return removeFilesOfUploads(res, filePath, 'Extension no valida.');
        }

    }else{
        return res.status(200).send({message:'No se han subido archivos.'});
    }

}

//Obtener una imagen
function getImage(req,res){
    var imageFile = req.params.imageFile;
    var pathFile = 'uploads/users/'+imageFile;

    fs.exists(pathFile, (exists) => {
        if(exists){
            res.sendFile(path.resolve(pathFile));
        }else{
            res.status(200).send({message: 'No existe imagen...'});
        }
    });

}

//Obtener cantidad de followers y followings
//no obtiene el user id, y el token aqui pasa como si nada
function getCounters(req, res){
    var userId = req.user.sub;
    console.log(req.user);
    if(req.params.id){
        console.log('--');
        userId = req.params.id;
    }
    console.log(userId);
    getCountFollow(userId).then( (value) => {
        return res.status(200).send({value});
    });
}

// Relacion de usuario con otro usuario. Seguidor y seguido
async function followThisUser(identity_user_id, user_id){
    try {
        var following = await Follow.findOne({ "user": identity_user_id, "followed": user_id}).exec()
            .then((following) => {
                console.log(following);
                return following;
            })
            .catch((err)=>{
                return handleerror(err);
            });
        var followed = await Follow.findOne({ "user": user_id, "followed": identity_user_id}).exec()
            .then((followed) => {
                console.log(followed);
                return followed;
            })
            .catch((err)=>{
                return handleerror(err);
            });
        return {
            following: following,
            followed: followed
        }
    } catch(e){
        console.log(e);
    }
}
// DEvuelve array de seguidores y seguidos
async function followUserIds(user_id){

    try{
        //Obejter los usuarios que seguimos          //El select es para mostrar los campos que yo quiera
        var following = await Follow.find({'user':user_id }).select({'_id':0, '__v':0, 'user': 0}).exec()
            .then((follows) =>{
                var follows_clean = [];
    
                follows.forEach((follow) =>{
                    //console.log("followed", follow.followed);
                    //Guardar los usuarios que yo sigo
                    follows_clean.push(follow.followed);
                });
    
                return follows_clean;
            })
            .catch((err)=>{
                return handleerror(err);
            });

        //Obejter los usuarios que seguimos          //El select es para mostrar los campos que yo quiera
        var followed = await Follow.find({'followed':user_id }).select({'_id':0, '__v':0, 'followed': 0}).exec()
            .then((follows) =>{
                var follows_clean = [];
                
                follows.forEach((follow) =>{
                    //console.log("user", follow.user);
                    //Guardar los usuarios que yo sigo
                    follows_clean.push(follow.user);
                });
                
                return follows_clean;
            })
            .catch((err)=>{
                return handleerror(err);
            });
    //console.log(followed);
        return {
            following: following,
            followed: followed
        }
    }catch(e){
        console.log(e);
    }
        
}

// Devuelve cantidad de seguidores y seguidos de userId
async function getCountFollow(user_id){
    try{
        var following = await Follow.countDocuments({"user":user_id}, (count) => {
            return count;
        });

        var followed = await Follow.countDocuments({"followed":user_id}, ( count) => {
            return count;
        });

        var publications = await Publication.countDocuments({"user":user_id}, (count) => {
            return count;
        });
        console.log(user_id);
        console.log('following '+ following);
        console.log('followed '+followed);
        console.log('publications ' +publications);
        return {
            following: following,
            followed: followed,
            publications: publications
        }
    }catch(err){
        console.log(err);
    }

}

//metodo auxiliar, borrar imagen de uploads
function removeFilesOfUploads(res, filePath, message){
    fs.unlink(filePath, (err) => {
        return res.status(200).send({message: message});
    })
}

module.exports = {
    saveUser,
    loginUser,
    getUser,
    getUsers,
    updateUser,
    uploadImage,
    getImage,
    getCounters
}