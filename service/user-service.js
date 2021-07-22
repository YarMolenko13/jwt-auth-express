const UserModel = require('../models/User')
const bcrypt = require('bcrypt')
const uuid = require('uuid')

const tokenService = require('./token-service')
const mailService = require('./mail-service')
const UserDto = require('../dtos/user-dto')
const ApiError = require('../exceptions/api-error')


class UserService {
    async registration(email, password) {
        // проверяем на наличие пользователя с таким же имейлом
        const candidate = await UserModel.findOne({email})
        if (candidate) {
            throw ApiError.badRequest(`Пользователь с почтой ${email} уже существует`)
        }
        // хешируем пароль
        const hashedPassword = await bcrypt.hash(password, 5)

        // генерация ссылки для активации
        let generatedLink = uuid.v4()
        let activationLink = process.env.API_URL + '/api/activate/' + generatedLink
        const user = await UserModel.create({email, password: hashedPassword, activationLink: generatedLink})
        await mailService.sendActivationMail(email, activationLink)

        const userDto = new UserDto(user) // id, email, isActivated
        const tokens = tokenService.generateTokens({...userDto})
        await tokenService.saveToken(userDto.id, tokens.refreshToken)

        return {
            ...tokens,
            user: userDto
        }
    }
    async login(email, password) {
        const user = await UserModel.findOne({email})
        if (!user) {
            throw ApiError.badRequest(('Пользоваетль с таким email не найде'))
        }
        const isPassEquals = await bcrypt.compare(password, user.password)
        if (!isPassEquals) {
            throw ApiError.badRequest('Неверный пароль')
        }
        const userDto = new UserDto(user)
        const tokens = tokenService.generateTokens({...userDto})

        await tokenService.saveToken(userDto.id, tokens.refreshToken)
        return {...tokens, user: userDto}

    }
    async logout(refreshToken) {
        const token = await tokenService.removeToken(refreshToken)
        return token
    }
    async refresh(refreshToken) {
        if (!refreshToken) {
            throw ApiError.unauthhorizedError()
        }
        const userData = tokenService.validateRefreshToken(refreshToken)
        const tokenFromDb = await tokenService.findToken(refreshToken)
        if (!userData || !tokenFromDb) {
            throw ApiError.unauthhorizedError()
        }
        const user = await UserModel.findById(userData.id)
        const userDto = new UserDto(user)
        const tokens = tokenService.generateTokens({...userDto})

        await tokenService.saveToken(userDto.id, tokens.refreshToken)
        return {...tokens, user: userDto}
    }
    async getUsers() {
        const users = await UserModel.find()
        return users;
    }
    async delteUsers() {
        await UserModel.remove()
    }
    async activate(activationLink) {
        const user = await UserModel.findOne({activationLink})
        if (!user) {
            throw ApiError.badRequest('Неккоректная ссылка активации')
        }
        user.isActivated = true
        await user.save()
    }
}

module.exports = new UserService()