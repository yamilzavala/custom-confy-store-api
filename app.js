require('dotenv').config()
require('express-async-errors')

const authRouter = require('./routes/authRoutes')
const userRouter = require('./routes/userRoutes')
const productRouter = require('./routes/productRoutes')
const reviewRouter = require('./routes/reviewRoutes')
const orderRouter = require('./routes/orderRoutes')
const fileUpload = require('express-fileupload');

const express = require('express');
const app = express();
const cookieParser = require('cookie-parser')
const rateLimiter = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');

//swagger
const swaggerUI = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml');

//other packages
const morgan = require('morgan')

//database
const connectDB = require('./db/connect');

//midlewares
app.use(express.json())
app.use(morgan('tiny'))
app.use(cookieParser(process.env.JWT_SECRET))
app.use(express.static('./public'))
app.use(fileUpload());

app.set('trust proxy', 1);
app.use(
  rateLimiter({
    windowMs: 5 * 60 * 1000,
    max: 1000,
  })
);
app.use(helmet());
app.use(cors());
app.use(xss());
app.use(mongoSanitize());

app.get('/', (req, res) => {
    res.send('<h1>Custom Confy Store API</h1><a href="/api-docs">Documentation</a>');
  });
  app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));

//middlewares - error handlers and 404 not found 
const notFoundMiddleware = require('./middleware/not-found')
const errorHandlerMiddleware = require('./middleware/error-handler')

//routes
// app.get('/api/v1', (req, res) => {
//     console.log('token:', req.cookies)
//     res.send('e-commerce api')
// })
app.use('/api/v1/auth',authRouter)
app.use('/api/v1/users', userRouter)
app.use('/api/v1/products', productRouter)
app.use('/api/v1/reviews', reviewRouter)
app.use('/api/v1/orders', orderRouter)

app.use(notFoundMiddleware)
app.use(errorHandlerMiddleware)

const port = process.env.PORT || 5000;

const start = async () => {
    try {
        //connect db
        await connectDB(process.env.MONGO_URL);

        app.listen(port, () => {
            console.log(`Server is listening on port ${port}...`)
        })
    } catch (error) {
        console.log(error)
    }
}

start()
