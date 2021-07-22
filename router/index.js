const Router = require('express').Router
const controller = require('./../controllers/user-controller')
const {body} = require('express-validator')
const {isLength} = require("validator")
const authMiddleware = require('../middlewares/auth-middleware')

const router = new Router()

router.post('/registration',
    body('email').isEmail(),
    body('password').isLength({min:5, max:15}),
    controller.registration)
router.post('/login', controller.login)
router.post('/logout', controller.logout)
router.get('/activate/:link', controller.activate)
router.get('/refresh', controller.refresh)
router.get('/users',authMiddleware, controller.getUsers)
router.delete('/users', controller.deleteUsers)

module.exports = router
