const express = require('express')
const { create, list, getById, getByCategory } = require('../controllers/skill.controller')

const router = express.Router()

router.post('/', create)
router.get('/', list)
router.get('/category/:category', getByCategory)
router.get('/:id', getById)

module.exports = router
