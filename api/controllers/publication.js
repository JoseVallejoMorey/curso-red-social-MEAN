'use strict'

var path = require('path');
var fs = require('fs');
var moment = require('moment');
var fsmongoosePaginate = require('mongoose-pagination');

var Publication = require('../models/publication');
var User = require('../models/user');
var Follow = require('../models/follow');


// 1-Recibir parametros
// 2-Comprobar parametros necesarios
// 3-Asignar valores a la entidad 
// 4-Guardar entidad
function savePublication(req,res){
    var params = req.body;

    if(!params.text) return res.status(200).send({message:'Faltan parametros'});

    var publi = new Publication();
    publi.text = params.text;
    publi.file = 'null';
    publi.user = req.user.sub;
    publi.created_at = moment().unix();

    publi.save( (err, publiStored) => {

        if(err) return res.status(500).send({message: 'Error al guardar publicacion.'});
        if(!publiStored) return res.status(404).send({message:'No se ha registrado el usuario.'});
        
        return res.status(200).send({publication: publiStored});
        
    });
}


function getPublication(req,res){
    var publiId = req.params.id;

    Publication.findById(publiId, (err, publication) => {
        if(err) return res.status(500).send({message: 'Error al devolver publicacion.'});
        if(!publication) return res.status(404).send({message: 'No existe publicacion.'});

        return res.status(200).send({publication});
    });
}

//Recojer parametros
//asignar parametros
//consultar los followed
//buscar de esos followed los que tienen publicacion
function getPublications(req,res){
    var page = 1;
    var itemsPerPage = 4;
    if(req.params.page){
        page = req.params.page;
    }

    //Esta consulta devuelve caa usuario que yo estoy siguiendo
    Follow.find({user: req.user.sub}).populate('followed').exec( (err, follows) => {
        if(err) return res.status(500).send({message: 'Error al devolver seguimiento.'});
        //console.log(follows);
        var follows_clean = [];
        follows.forEach( (follow)=> {
            follows_clean.push(follow.followed);
        });
        console.log(follows_clean);
        //Buscar publicaciones de los usuarios que estan en el array

        Publication.find({user: {"$in": follows_clean}}).sort('created_at').populate('user').paginate(page, itemsPerPage, (err, publications, total) => {
            if(err) return res.status(500).send({message: 'Error al devolver publicaciones.'});
            if(!publications) return res.status(404).send({message: 'No hay publicaciones.'});

            return res.status(200).send({
                total_items: total,
                pages : Math.ceil(total/itemsPerPage),
                page: page,
                publications
            });

        });

    });
}


function deletePublications(req,res){
    var publiId = req.params.id;
    //¿Porque no em,plear .findByIdAndRemove?
    //hay que comprobar que seamos los dueños de la publicacion
    Publication.find({'user': req.user.sub, '_id': publiId}).remove( (err) => {
        if(err) return res.status(500).send({message: 'Error al devolver publicacion.'});
        if(!publicationRemoved) return res.status(404).send({message: 'No existe publicacion.'});

        return res.status(200).send({message: 'Publicacion eliminada.'});
    });
}

//Subir una imagen
function uploadImage(req, res){
    var publiId = req.params.id;

    if(req.files){
        var filePath = req.files.image.path;
        var fileSplit = filePath.split('/');
        var fileName = fileSplit[2];
        var extSplit = fileName.split('.');
        var fileExt = extSplit[1].toLowerCase();

        // if(publiId != req.user.sub){
        //     return removeFilesOfUploads(res, filePath, 'No tienes permiso.');
        // }

        if( fileExt == 'png' || 
            fileExt == 'jpg' ||
            fileExt == 'jpeg' ||
            fileExt == 'gif' ){

            //Primero se comprueba que el usuario sea el dueño de la publicacion
            //con find() solo, sacaria un array que auque estuviera vacio dejaria pasar
            //mejor emplear findOne()
            Publication.findOne({'user': req.user.sub, '_id': publiId}).exec( (err, publication) => {

                if(publication){
                    Publication.findByIdAndUpdate(publiId,{file:fileName},{new:true}, (err, publiUpdated)=> {
                        if (err) return res.status(500).send({message:'Error en la peticion.'});
                        if (!publiUpdated) return res.status(404).send({message:'No se ha podido actualizar.'});
                        
                        return res.status(200).send({publication: publiUpdated});
                    });
                }else{
                    return removeFilesOfUploads(res, filePath, 'No tienes permiso para actualizar la publicacion.');
                }

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
    var pathFile = 'uploads/publications/'+imageFile;

    fs.exists(pathFile, (exists) => {
        if(exists){
            res.sendFile(path.resolve(pathFile));
        }else{
            res.status(200).send({message: 'No existe imagen...'});
        }
    });

}


//metodo auxiliar, borrar imagen de uploads
function removeFilesOfUploads(res, filePath, message){
    fs.unlink(filePath, (err) => {
        return res.status(200).send({message: message});
    })
}


module.exports = {
    savePublication,
    getPublications,
    getPublication,
    deletePublications,
    getImage,
    uploadImage
}