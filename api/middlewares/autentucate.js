'use strict'

var jwt = require('jwt-simple');
var moment = require('moment');
var secret = 'clave-secreta';

//next es la funcionalidad que nos permite salir del middleware
exports.ensureAuth = function(req, res, next){
    //El token nos tiene que llegar por una cabecera
    if(!req.headers.autorization){
        return res.status(403).send({message: 'No cabecera de autorizacion.'})
    }else{
        //reemplazar comillas simples y dobles que haya en todo el string
        var token = req.headers.autorization.replace(/['"]+/g,'');
        try{
            var payload = jwt.decode(token, secret);

            if(payload.exp <= moment().unix() ){
                return res.status(401).send({
                    message: 'El token ha expirado'
                })
            }
        }catch(ex){
            return res.status(404).send({
                message: 'El token no es valido'
            })
        }
        
        //Creo esta variable con la informacion del usuario si no hay problemas
        //adjuntamos el payload a la request, en los controladores tenemos acceso asi a 
        //todos los datos que envia el token
        req.user = payload;

        next();

    }
}