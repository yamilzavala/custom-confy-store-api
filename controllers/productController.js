const Product = require('../models/Product')
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors')
const path = require('path')

const createProduct = async (req, res) => {
    req.body.user = req.user.userId;
    const product = await Product.create(req.body)
    res.status(StatusCodes.CREATED).json({product})
}

const getAllProducts = async (req, res) => {
    const products = await Product.find({})
    res.status(StatusCodes.OK).json({products, count: products.length})
}

const getSingleProduct = async (req, res) => {
    const product = await Product.findOne({_id: req.params.id}).populate('reviews')

    if(!product) {
        throw new CustomError.NotFoundError(`No product with id ${req.params.id}`)
    }
    res.status(StatusCodes.OK).json({product})
}

const updateProduct = async (req, res) => {
    const {name, price} = req.body;
    if(!name || !price) throw new CustomError.BadRequestError('Please provide all values')
    const product = await Product.findOneAndUpdate(
        {_id: req.params.id},
        req.body,
        {new: true, runValidators: true}
    )
    if(!product) throw new CustomError.NotFoundError(`No product with id ${req.params.id}`)
    res.status(StatusCodes.OK).json({product, msg: 'Success! Product Updated'})
}

const deleteProduct = async (req, res) => {
    const product = await Product.findOne({id: req.params.id})
    if(!product) throw new CustomError.NotFoundError(`No product with id ${req.params.id}`)
    await product.remove();
    res.status(StatusCodes.OK).json({msg: 'Success! Product Deleted'})
}

const uploadImage = async (req, res) => {
    if(!req.files) throw new CustomError.BadRequestError('No File Uploaded');        
    const productImage = req.files.image;
    if(!productImage.mimetype.startsWith('image')) throw new CustomError.BadRequestError('Please Upload Image');
    const maxSize = 1024*1024;
    if(productImage.size > maxSize) throw new CustomError.BadRequestError('Please upload image smaller than 1MB');
    const imagePath = path.join(__dirname, `../public/uploads/${productImage.name}`)
    await productImage.mv(imagePath)
    return res.status(StatusCodes.OK).json({
        image: {
            src: `./uploads/${productImage.name}`
        } 
    })
}

module.exports = {
    createProduct,
    getAllProducts,
    getSingleProduct,
    updateProduct,
    deleteProduct,
    uploadImage
}
