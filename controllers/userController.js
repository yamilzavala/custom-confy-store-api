const User = require('../models/User')
const { StatusCodes } = require('http-status-codes')
const CustomError = require('../errors')
const {createTokenUser, attachCookiesToResponse, checkPermissions } = require('../utils')

const getAllUsers = async (req, res) => {
    console.log('req.user: ', req.user)
    const users = await User.find({role: 'user'}).select('-password')
    res.status(StatusCodes.OK).json({users})
}

const getSingleUser = async (req, res) => {
    const user = await User.findOne({
        _id: req.params.id
    }).select('-password')

    if(!user) {
        throw new CustomError.NotFoundError(`No user with id ${req.params.id}`)
    }

    checkPermissions(req.user, user._id)
    
    res.status(StatusCodes.OK).json({user})
}

//uddate user with findOneAndUpdate
// const updateUserWithFindOneAndUpdate = async (req, res) => {
//     const {userId} = req.user;
//     const {email, name} = req.body;

//     if(!email || !name) {
//         throw new CustomError.BadRequestError('Email and name fields cannot be empty')
//     }

//     const user = await User.findOneAndUpdate(
//         {_id: userId}, 
//         req.body,
//         {new: true, runValidators: true}
//     )

//     if(!user) {
//         throw new CustomError.NotFoundError(`No job with id ${req.params.id}`)
//     }

//     const tokenUser = await createTokenUser(user)
//     attachCookiesToResponse({res, user: tokenUser}) 
//     res.status(StatusCodes.OK).json({user: tokenUser}) 
// }

//uddate user with User.save()
const updateUser = async (req, res) => {
    const {userId} = req.user;
    const {email, name} = req.body;

    if(!email || !name) {
        throw new CustomError.BadRequestError('Email and name fields cannot be empty')
    }

    const user = await User.findOne({_id: userId})

    if(!user) {
        throw new CustomError.NotFoundError(`No job with id ${req.params.id}`)
    }

    user.email = email;
    user.name = name;
    await user.save()

    const tokenUser = await createTokenUser(user)
    attachCookiesToResponse({res, user: tokenUser}) 
    res.status(StatusCodes.OK).json({user: tokenUser}) 
}

const updateUserPassword = async (req, res) => {
    const {oldPassword, newPassword} = req.body;
    if(!oldPassword || !newPassword) {
        throw new CustomError.BadRequestError('Please provide both values')
    }
    const user = await User.findOne({_id: req.user.userId})
    
    const isPasswordCorrect = await user.comparePassword(oldPassword);
    if(!isPasswordCorrect) {
        throw new CustomError.UnauthenticatedError('Invalid credentials')
    }

    user.password = newPassword;
    await user.save();
    res.status(StatusCodes.OK).json({msg:'Success! Password has been updated'})   
}

const showCurrentUser = async (req, res) => {
    const {user} = req;
    res.status(StatusCodes.OK).json({user})
}

module.exports = {
    getAllUsers,
    getSingleUser,
    showCurrentUser,
    updateUser,
    updateUserPassword
}