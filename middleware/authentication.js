const CustomErrors = require('../errors')
const {isTokenValid} = require('../utils')

const authenticateUser = async (req, res, next) => {
    const token = req.cookies.token;
    console.log('req.cookies.token: ', req.cookies.token)
    
    if(!token) {
        throw new CustomErrors.UnauthenticatedError('Authentication invalid');
    }
    try {
        const {userId, role, name} = isTokenValid({token})
        req.user = { userId, role, name }
        next()
    } catch (error) {
        throw new CustomErrors.UnauthenticatedError('Authentication invalid');
    }
}

const authorizePermissions = (...roles) => {
     return (req, res, next) => {        
        if(!roles.includes(req.user.role)) {
            throw new CustomErrors.UnauthorizedError('Unthorized to access this route. Only admin users can access here.');
        }
        next()
    }
}



module.exports = {
    authenticateUser,
    authorizePermissions
};