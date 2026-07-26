const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary-v2');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ficha-rpg-jopa/spells',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
    // Cloudinary bloqueia a entrega de PDFs enviados como resource_type "raw" por padrão
    // (restrição de segurança). Forçar "image" evita esse bloqueio e ainda funciona
    // normalmente para fotos comuns.
    resource_type: 'image'
  }
});

const uploadSpell = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

module.exports = uploadSpell;
