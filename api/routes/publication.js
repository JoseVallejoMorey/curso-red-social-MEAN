'use strict'

var express = require('express');
var PublicationController = require('../controllers/publication');
var api = express.Router();
var md_auth = require('../middlewares/autentucate');
var multipart = require('connect-multiparty');
var md_upload = multipart({uploadDir: './uploads/publications'});

api.post('/publicar', md_auth.ensureAuth, PublicationController.savePublication);
api.get('/publicaciones/:page?', md_auth.ensureAuth, PublicationController.getPublications);
api.get('/publicacion/:id?', md_auth.ensureAuth, PublicationController.getPublication);
api.get('/get-image-pub/:imageFile', PublicationController.getImage);

api.delete('/publicacion/:id?', md_auth.ensureAuth, PublicationController.deletePublications);

api.post('/upload-image-pub/:id',[md_auth.ensureAuth, md_upload], PublicationController.uploadImage);

module.exports = api;

