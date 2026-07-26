const express = require('express');
const Character = require('../models/Character');
const { auth, masterAuth } = require('../middleware/auth');
const router = express.Router();
const upload = require('../middleware/upload');
const uploadSpell = require('../middleware/uploadSpell');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');

// Criar nova ficha (jogadores e mestres)
router.post('/', auth, async (req, res) => {
  try {
    const character = new Character({
      ...req.body,
      owner: req.user._id
    });
    
    await character.save();
    res.status(201).json(character);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar ficha', error: error.message });
  }
});

// Buscar fichas do usuário logado
router.get('/my-characters', auth, async (req, res) => {
  try {
    const characters = await Character.find({ owner: req.user._id })
      .sort({ updatedAt: -1 });
    res.json(characters);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar fichas', error: error.message });
  }
});

// Buscar TODAS as fichas (apenas mestres)
router.get('/all', auth, masterAuth, async (req, res) => {
  try {
    const characters = await Character.find()
      .populate('owner', 'username email')
      .sort({ updatedAt: -1 });
    res.json(characters);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar fichas', error: error.message });
  }
});

// Buscar ficha específica
router.get('/:id', auth, async (req, res) => {
  try {
    const character = await Character.findById(req.params.id)
      .populate('owner', 'username email');

    if (!character) {
      return res.status(404).json({ message: 'Ficha não encontrada' });
    }

    // Verificar permissão: dono da ficha ou mestre
    if (character.owner._id.toString() !== req.user._id.toString() &&
        req.user.role !== 'master') {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    // Atualizar lastAccessed
    await Character.findByIdAndUpdate(req.params.id, { lastAccessed: new Date() });

    res.json(character);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar ficha', error: error.message });
  }
});

// Atualizar ficha
router.put('/:id', auth, async (req, res) => {
  try {
    const character = await Character.findById(req.params.id);

    if (!character) {
      return res.status(404).json({ message: 'Ficha não encontrada' });
    }

    // Verificar permissão: dono da ficha ou mestre
    if (character.owner.toString() !== req.user._id.toString() &&
        req.user.role !== 'master') {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    const { image, ...safeBody } = req.body;

    const updatedCharacter = await Character.findOneAndUpdate(
      { _id: req.params.id },
      { $set: { ...safeBody, lastAccessed: new Date() } },
      { new: true }
    ).populate('owner', 'username email');

    res.json(updatedCharacter);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar ficha', error: error.message });
  }
});

// Upload de imagem do personagem
router.post('/:id/upload-image', auth, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Imagem muito grande. O limite é 10MB.' });
      }
      return res.status(400).json({ message: 'Erro no upload da imagem', error: err.message });
    } else if (err) {
      return res.status(500).json({ message: 'Erro ao processar imagem', error: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    const character = await Character.findById(req.params.id);

    if (!character) {
      return res.status(404).json({ message: 'Ficha não encontrada' });
    }

    // Verificar permissão: dono da ficha ou mestre
    if (character.owner.toString() !== req.user._id.toString() &&
        req.user.role !== 'master') {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Nenhuma imagem enviada' });
    }

    character.image = req.file.path;
    character.lastAccessed = new Date();
    await character.save();

    res.json({ message: 'Imagem atualizada com sucesso', image: character.image });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao fazer upload da imagem', error: error.message });
  }
});

// Upload de anexo de magia (imagem ou PDF) - página 2
router.post('/:id/upload-spell-attachment', auth, (req, res, next) => {
  uploadSpell.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Arquivo muito grande. O limite é 10MB.' });
      }
      return res.status(400).json({ message: 'Erro no upload do arquivo', error: err.message });
    } else if (err) {
      return res.status(500).json({ message: 'Erro ao processar arquivo', error: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    const character = await Character.findById(req.params.id);

    if (!character) {
      return res.status(404).json({ message: 'Ficha não encontrada' });
    }

    // Verificar permissão: dono da ficha ou mestre
    if (character.owner.toString() !== req.user._id.toString() &&
        req.user.role !== 'master') {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Nenhum arquivo enviado' });
    }

    character.spellAttachment = {
      url: req.file.path,
      publicId: req.file.filename,
      resourceType: req.file.resource_type || (req.file.mimetype?.startsWith('image/') ? 'image' : 'raw'),
      format: req.file.format || '',
      fileName: req.file.originalname
    };
    character.lastAccessed = new Date();
    await character.save();

    res.json({ message: 'Anexo de magia atualizado com sucesso', spellAttachment: character.spellAttachment });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao fazer upload do anexo de magia', error: error.message });
  }
});

// Remover anexo de magia
router.delete('/:id/spell-attachment', auth, async (req, res) => {
  try {
    const character = await Character.findById(req.params.id);

    if (!character) {
      return res.status(404).json({ message: 'Ficha não encontrada' });
    }

    // Verificar permissão: dono da ficha ou mestre
    if (character.owner.toString() !== req.user._id.toString() &&
        req.user.role !== 'master') {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    if (character.spellAttachment?.publicId) {
      try {
        await cloudinary.uploader.destroy(character.spellAttachment.publicId, {
          resource_type: character.spellAttachment.resourceType === 'image' ? 'image' : 'raw'
        });
      } catch (destroyError) {
        console.error('Erro ao remover arquivo do Cloudinary:', destroyError);
      }
    }

    character.spellAttachment = { url: '', publicId: '', resourceType: '', fileName: '' };
    character.lastAccessed = new Date();
    await character.save();

    res.json({ message: 'Anexo de magia removido com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover anexo de magia', error: error.message });
  }
});

// Deletar ficha
router.delete('/:id', auth, async (req, res) => {
  try {
    const character = await Character.findById(req.params.id);
    
    if (!character) {
      return res.status(404).json({ message: 'Ficha não encontrada' });
    }
    
    // Verificar permissão: dono da ficha ou mestre
    if (character.owner.toString() !== req.user._id.toString() && 
        req.user.role !== 'master') {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    
    await Character.findByIdAndDelete(req.params.id);
    res.json({ message: 'Ficha deletada com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar ficha', error: error.message });
  }
});

module.exports = router;