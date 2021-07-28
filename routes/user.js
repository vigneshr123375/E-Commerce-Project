const { response } = require('express');
var express = require('express');
var router = express.Router();
var productHelper = require('../Helpers/product-helpers')
const userHelpers = require('../Helpers/user-helpers')
const verifyLogin = (req, res, next) => {
        if (req.session.userloggedIn) {
            next()

        } else {
            res.redirect('/login')
        }
    }
    /* GET home page. */
router.get('/', async function(req, res, next) {
    let user = req.session.user
    let cartCount = null
    if (req.session.user) {
        cartCount = await userHelpers.getCartCount(req.session.user._id)
    }

    productHelper.getAllProducts().then((products) => {

        res.render('user/view-products', { products, title: "E-commerce", user, cartCount })
    })

});

router.get('/login', (req, res) => {
    if (req.session.userloggedIn) {
        res.redirect('/')
    } else {
        res.render('user/login', { 'loginError': req.session.userloginError, title: "E-commerce" })
        req.session.userloginError = false
    }

})
router.get('/end', (req, res) => {
    res.redirect('/')
})

router.get('/forgot', (req, res) => {
    res.render('user/forgot', { title: "E-commerce" })
})

router.post('/login', (req, res) => {
    userHelpers.doLogin(req.body).then((response) => {
        if (response.status) {

            req.session.user = response.user
            req.session.userloggedIn = true
            res.redirect('/')
        } else {
            req.session.userloginError = 'Invalid Username or Password'
            res.redirect('/login')
        }
    })
})

router.get('/logout', (req, res) => {
    req.session.user = null
    res.redirect('/')
})

router.get('/signup', (req, res) => {
    res.render('user/signup', { title: "E-commerce" })
})

router.post('/signup', (req, res) => {

    userHelpers.doSignup(req.body).then((response) => {
        /*console.log(response)*/

        req.session.user = response
        req.session.userloggedIn = true
        res.redirect('/')

    })

})

router.get('/cart', verifyLogin, async(req, res) => {
    let cartCount = null
    if (req.session.user) {
        cartCount = await userHelpers.getCartCount(req.session.user._id)
        if (cartCount == 0) {
            res.render('user/cart2', { user: req.session.user, cartCount, title: "E-commerce" })
        }
    }
    let totalAmount = await userHelpers.getTotalAmount(req.session.user._id)
        // let subtotal = await userHelpers.getCartAmount(req.session.user._id)
    let products = await userHelpers.getCartProducts(req.session.user._id)
        // console.log(subtotal + 'workng amnt');

    res.render('user/cart', { products, user: req.session.user, cartCount, title: "E-commerce", totalAmount })












})

router.get('/add-to-cart/:id', (req, res) => {

    userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
        res.json({ status: true })
            //  res.redirect('/')         
    })

})



router.post('/change-product-quantity', (req, res, next) => {

    userHelpers.changeProductQuantity(req.body).then((response) => {
        // response.totalAmount=await userHelpers.getTotalAmount(req.body.user)
        res.json(response)

        //  console.log(response);   
    })
})


router.post('/delete-cart-item', (req, res, next) => {

    userHelpers.deleteCartItem(req.body).then((response) => {
        res.json(response)

    })
})

router.get('/place-order', verifyLogin, async(req, res) => {
    let totalAmount = await userHelpers.getTotalAmount(req.session.user._id)

    cartCount = await userHelpers.getCartCount(req.session.user._id)

    res.render('user/placeOrder', { user: req.session.user, cartCount, title: "E-commerce", totalAmount })
})

router.post('/place-order', verifyLogin, async(req, res) => {
    let products = await userHelpers.getCartProductsList(req.body.UserId)
    let totalAmount = await userHelpers.getTotalAmount(req.body.UserId)
    userHelpers.placeOrder(req.body, products, totalAmount).then((orderId) => {
        if (req.body['payment-method'] === 'COD') {
            res.json({ codSuccess: true })
        } else {
            userHelpers.generateRazorpay(orderId, totalAmount).then((response) => {
                res.json(response)
            })
        }





    })

})

router.get('/order-confirmed', verifyLogin, async(req, res) => {

    res.render('user/order-confirmed', { user: req.session.user, title: "E-commerce" })
})

router.get('/myOrders', verifyLogin, async(req, res) => {
    let orders = await userHelpers.getuserOrders(req.session.user._id)

    cartCount = await userHelpers.getCartCount(req.session.user._id)

    res.render('user/myOrders', { user: req.session.user, title: "E-commerce", orders, cartCount })



})

router.get('/view-order-products/:id', verifyLogin, async(req, res) => {
    let products = await userHelpers.getorderProducts(req.params.id)

    cartCount = await userHelpers.getCartCount(req.session.user._id)
    res.render('user/orderView', { user: req.session.user, title: "E-commerce", products, cartCount })
})

router.get('/trackOrder', verifyLogin, async(req, res) => {


    cartCount = await userHelpers.getCartCount(req.session.user._id)
    res.render('user/trackOrder', { user: req.session.user, title: "E-commerce", cartCount })
})

router.post('/verify-payment', (req, res) => {

    userHelpers.verifyPayment(req.body).then(() => {
        userHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {

            res.json({ status: true })
        })
    }).catch((err) => {

        res.json({ status: false })
    })

})

router.get('/onlineSuccess', verifyLogin, async(req, res) => {
    orders = await userHelpers.getuserOrders(req.session.user._id)



    res.render('user/onlineSuccess', { user: req.session.user, title: "E-commerce" })
})
router.get('/onlineFailed', verifyLogin, (req, res) => {
    res.render('user/onlineFailed')
})

router.get('/clearOrder/', verifyLogin, (req, res) => {
    userHelpers.clearOrder(req.session.user._id).then((response) => {
        res.render('user/myOrders')

    })
})

module.exports = router;