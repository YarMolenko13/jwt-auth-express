const ApiError = require('../exceptions/api-error')
const tokenService = require('../service/token-service')

module.exports = (req, res, next) => {
    try {
        const authorizationHeader = req.headers.authorization
        if (!authorizationHeader) {
            return next(ApiError.unauthhorizedError())
        }
        const accessToken = authorizationHeader.split(' ')[1]
        if (!accessToken) {
            return next(ApiError.unauthhorizedError())
        }
        const userData = tokenService.validateAccessToken(accessToken)
        if (!userData) {
            return next(ApiError.unauthhorizedError())
        }
        req.user = userData
        next()
    } catch (e) {
        throw ApiError.unauthhorizedError()
    }
}