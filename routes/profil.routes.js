const express = require('express');
const router = express.Router();
const ProfilController = require('../controllers/profil.controller');

router.get('/get/:id', ProfilController.getProfile);
router.put('/update/:id', ProfilController.updateProfile);
router.post('/upload-avatar', ProfilController.uploadAvatar);

module.exports = router;
