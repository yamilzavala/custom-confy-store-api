const User = require('../models/User')
const { StatusCodes } = require('http-status-codes')
const CustomErrors = require('../errors')
const { attachCookiesToResponse, removeCookies, createTokenUser } = require('../utils')

const register = async (req, res) => {
    const {email, name, password} = req.body;
    
    const emailAlreadyExists = await User.findOne({email});
    if(emailAlreadyExists) {
        throw new CustomErrors.BadRequestError('Email already exists')        
    }

    const isFirstAccount = (await User.countDocuments({})) === 0;
    const role = isFirstAccount ? 'admin' : 'user';

    const user = await User.create({email, name, password, role})
    const tokenUser = {
        name: user.name,
        userId: user._id,
        role: user.role
    }

    attachCookiesToResponse({res, user: tokenUser})

    res.status(StatusCodes.CREATED).json({user: tokenUser})
}

const login = async (req, res) => {
    const {email, password} = req.body;

    if(!email || !password) {
        throw new CustomErrors.BadRequestError('Please provide email and password')
    }
    const user = await User.findOne({email})
    if(!user) {
        throw new CustomErrors.UnauthenticatedError('Invalid Credentials')
    }
    const isPasswordCorrect = await user.comparePassword(password)
    if(!isPasswordCorrect) {
        throw new CustomErrors.UnauthenticatedError('Invalid Credentials')
    }
    const tokenUser = createTokenUser(user);
    attachCookiesToResponse({res, user: tokenUser})
    res.status(StatusCodes.OK).json({user: tokenUser})    
}

const logout = async (req, res) => {
    removeCookies(res)
    res.status(StatusCodes.OK).json({msg: 'User logged out'})
}

module.exports = {
    login,
    register,
    logout
}