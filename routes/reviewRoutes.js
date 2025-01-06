const express = require('express');
const router = express.Router();
const {authenticateUser} = require('../middleware/authentication')
const {
    createReview, 
    getAllReviews, 
    getSingleReview, 
    updateReview, 
    deleteReview
} = require('../controllers/reviewController')

router.route('/')
    .get(getAllReviews)
    .post(authenticateUser,createReview)
    
router.route('/:id')
    .delete(authenticateUser,deleteReview)
    .patch(authenticateUser,updateReview)
    .get(getSingleReview)

module.exports = router;