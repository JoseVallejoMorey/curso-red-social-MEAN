'use script'

var jwt = require('jwt-simple');
var moment = require('moment');
var secret = 'clave-secreta';

//Creamos el metodo
//contiene un objeto con los datos del usuario para crear el token
//iat: fecha creacion de token
//exp fecha de expiracion de token
exports.createToken = function(user){
    var payload = {
        sub: user._id,
        name: user.name,
        surname: user.surname,
        nick: user.nick,
        email: user.email,
        role: user.role,
        image: user.image,
        iat: moment().unix,
        exp: moment().add(30,'days').unix
    };


    // Con los datos del usuario y la clave secreta se generara el token
    return jwt.encode(payload, secret);
};