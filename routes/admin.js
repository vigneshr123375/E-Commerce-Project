var express = require('express');
const productHelpers = require('../Helpers/product-helpers');
var router = express.Router();
var productHelper = require('../Helpers/product-helpers')



/* GET users listing. */
router.get('/', function(req, res, next) {

    productHelpers.getAllProducts().then((products) => {

        res.render('admin/admin-view', { products, admin: true })
    })

    // res.send('Welcome To Admin Page');

});



router.get('/add-product', function(req, res) {
    res.render('admin/add-product', { admin: true })
})

router.post('/add-product', (req, res) => {
    //  console.log(req.body)
    // console.log(req.files.Image)
    productHelper.addProduct(req.body, (id, name) => {

        let image = req.files.Image
        image.mv('./public/product-images/' + id + '.jpg', (err, done) => {
            if (!err) {
                res.render('admin/add-product', { name, admin: true })
            } else {
                console.log(err);
            }


        })

    })
})

router.get('/delete-product/:id', (req, res) => {
    let prodID = req.params.id
    productHelper.deleteProduct(prodID).then((response) => {
        res.redirect('/admin/')

    })

})

router.get('/edit-product/:id', async(req, res) => {
    let product = await productHelpers.getProductDetails(req.params.id)

    res.render('admin/edit-product', { product, admin: true })
})

router.post('/edit-product/:id', (req, res) => {

    productHelper.updateProduct(req.params.id, req.body).then(() => {

        res.redirect('/admin')
        if (req.files.Image) {
            let image = req.files.Image
            let id = req.params.id
            image.mv('./public/product-images/' + id + '.jpg')
        }
    })


})

module.exports = router;