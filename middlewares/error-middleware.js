const ApiError = require('../exceptions/api-error')

module.exports = (err, req, res, next) => {
    console.log(err)
   if (err instanceof ApiError) {
       return res.status(err.status).json({status: err.status, message: err.message, errors: err.errors})
   }
   return res.status(500).json({status: 500,message: 'Непредвиденная ошибка'})
}