const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors')
const Order = require('../models/Order');
const Product = require('../models/Product')
const {checkPermissions } = require('../utils')

const getAllOrders = async (req, res) => {
    const orders = await Order.find({})
    res.status(StatusCodes.OK).json({orders, count: orders.length})
}
const getSingleOrder = async (req, res) => {
    const order = await Order.findOne({_id: req.params.id})
    if(!order) throw new CustomError.NotFoundError(`No order with id ${req.params.id}`)
    checkPermissions(req.user, order.user)
    res.status(StatusCodes.OK).json({order})
}
const getCurrentUserOrders = async (req, res) => {
    const orders = await Order.find({user: req.user.userId})
    res.status(StatusCodes.OK).json({orders, count: orders.length})
}

const fakeStripeAPI = async ({amount, currency}) => {
    const client_secret = 'someRandomValue';
    return {client_secret, amount}
}

const createOrder = async (req, res) => {
    const {items: cartItems, shippingFee, tax} = req.body;

    if(!cartItems || cartItems.length < 1) throw new CustomError.BadRequestError('No cart items provided')
    if(!shippingFee || !tax) throw new CustomError.BadRequestError('Please provide tax and shipping fee')
    
    let orderItems = [];
    let subtotal = 0;

    for(let item of cartItems) {
        const dbProduct = await Product.findOne({_id: item.product})
        if(!dbProduct) throw new CustomError.NotFoundError(`No product with id ${item.product}`)
        const {name, price, image, _id} = dbProduct;
        const singleOrderItem = {
            amount: item.amount,
            name,
            price,
            image,
            product: _id
        }
        //add item to order
        orderItems = [...orderItems, singleOrderItem]
        //calculate subtotal
        subtotal += item.amount * price;
    }
    //calculate total    
    const total = subtotal + tax + shippingFee;
    //get client secret
    const paimentIntent = await fakeStripeAPI({
        amount: total,
        currency: 'usd',
    })    

    const order = await Order.create({
        tax, 
        shippingFee,
        subtotal,
        total,
        orderItems,
        user: req.user.userId,
        clientSecret: paimentIntent.client_secret,
    })
    res.status(StatusCodes.CREATED).json({order, clientSecret: order.clientSecret})
}
const updateOrder = async (req, res) => {
    const {paymentIntentId} = req.body;
    const order = await Order.findOne({_id: req.params.id})
    if(!order) throw new CustomError.NotFoundError(`No order with id ${req.params.id}`)
    checkPermissions(req.user, order.user)
    order.status = 'paid';
    order.paymentIntentId = paymentIntentId;
    await order.save()
    res.status(StatusCodes.OK).json({order, msg: 'Success! Order updated!'})
}

module.exports = {
    getAllOrders, 
    getSingleOrder, 
    getCurrentUserOrders,
    createOrder, 
    updateOrder
}