'use strict'


var mongoose = require('mongoose');
var app = require('./app');
var port = 3800;

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/red-social', { useNewUrlParser: true })
.then( () =>{
    app.listen(port, ()=>{
        console.log('conexion realizada con exito en localhost:'+ port);
    });
}).catch( (err) => console.log(err));




