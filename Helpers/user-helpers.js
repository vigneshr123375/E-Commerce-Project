

var db = require('../Config/connection')
var collection = require('../Config/collections')
const bcrypt = require('bcrypt')
var objectID = require('mongodb').ObjectID
const { promise } = require('bcrypt/promises')
const Razorpay = require('razorpay')
var instance = new Razorpay({ key_id: 'rzp_test_K8IfC8SMY6H67T', key_secret: 'OhqR3TLUJutYE39Wco9ntcos' })

module.exports = {
    doSignup: (userData) => {


        return new Promise(async (resolve, reject) => {
            userData.ConfirmPassword = await bcrypt.hash('' + userData.ConfirmPassword, 10)
            userData.Password = await bcrypt.hash('' + userData.Password, 10)

            // console.log(userData.Password,"password")
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                resolve(data.ops[0])

            })

        })


    },
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.Email })
            if (user) {
                bcrypt.compare(userData.Password, user.Password).then((status) => {
                    if (status) {

                        response.user = user
                        response.status = true
                        resolve(response)

                    } else {

                        resolve({ status: false })
                    }
                })
            } else {

                resolve({ status: false })
            }
        })
    },
    addToCart: (proId, userId) => {
        let proObj = {
            item: objectID(proId),
            quantity: 1
        }

        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectID(userId) })
            if (userCart) {
                let proExist = userCart.products.findIndex(product => product.item == proId)
                if (proExist != -1) {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectID(userId), 'products.item': objectID(proId) },
                        {
                            $inc: { 'products.$.quantity': 1 }
                        }).then(() => {
                            resolve()
                        })
                } else {


                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: objectID(userId) },
                            {

                                $push: { products: proObj }

                            }


                        ).then((response) => {
                            resolve()
                        })
                }

            } else {
                let cartObj = {
                    user: objectID(userId),
                    products: [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                })
            }
        })
    },

    addToFart: (proId, userId) => {
        let proObj = {
            item: objectID(proId),
            quantity: 1
        }

        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectID(userId) })
            if (userCart) {
                let proExist = userCart.products.findIndex(product => product.item == proId)
                console.log(proExist);
                if (proExist != -1) {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectID(userId), 'products.item': objectID(proId) },
                        {
                            $inc: { 'products.$.quantity': 1 }
                        }).then(() => {
                            resolve()
                        })
                } else {


                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: objectID(userId) },
                            {

                                $push: { products: proObj }

                            }


                        ).then((response) => {
                            resolve()
                        })
                }

            } else {
                let cartObj = {
                    user: objectID(userId),
                    products: [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                })
            }
        })
    },
    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectID(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }

            ]).toArray()

            resolve(cartItems)

        })
    },
    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectID(userId) })
            if (cart) {
                count = cart.products.length

            }
            resolve(count)

        })

    },

    changeProductQuantity: (details) => {

        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)

        return new Promise((resolve, reject) => {

            if (details.count == -1 && details.quantity == 1) {
                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectID(details.cart) },
                    {
                        // $pull:{products:{item:objectID(details.product)}}   

                    }
                ).then((response) => {
                    resolve({ removeProduct: true })
                })
            } else {
                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectID(details.cart), 'products.item': objectID(details.product) },
                    {
                        $inc: { 'products.$.quantity': details.count }

                    }
                ).then((response) => {

                    resolve({ status: true })
                })

            }

        })
    },



    deleteCartItem: (details) => {



        return new Promise((resolve, reject) => {


            db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectID(details.cart) },
                {
                    $pull: { products: { item: objectID(details.product) } }

                }
            ).then((response) => {
                resolve({ removeProduct: true })
            })


        })
    },

    getTotalAmount: (userId) => {

        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectID(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $group: {
                        _id: null,

                        total: { $sum: { $multiply: [{ $toInt: '$quantity' }, { $toInt: '$product.Price' }] } }
                    }

                }



            ]).toArray()
            resolve(total[0].total)

        })

    },




    placeOrder: (order, products, totalAmount) => {
        return new Promise(async (resolve, reject) => {

            let status = order['payment-method'] === 'COD' ? 'placed' : 'pending'

            let date = new Date().toLocaleDateString()
            totalAmount
            let orderObj = {

                no: 1,
                deliveryDetails: {
                    fullname: order.fullname,
                    email: order.email,
                    address: order.address,
                    city: order.city,
                    state: order.state,
                    zip: order.zip,
                    sameadr: order.sameadr,




                },
                userId: objectID(order.UserId),
                paymentMethod: order['payment-method'],
                products: products,
                totalAmount: totalAmount,
                status: status,
                date: date
            }


            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {

                db.get().collection(collection.CART_COLLECTION).removeOne({ user: objectID(order.UserId) })
                resolve(response.ops[0]._id)
            })
        })
    },

    getCartProductsList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectID(userId) })

            resolve(cart.products)
        })
    },

    getuserOrders: (userId) => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find({ userId: objectID(userId) }).toArray()
            resolve(orders)
        })
    },

    getorderProducts: (orderId) => {

        return new Promise(async (resolve, reject) => {
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: objectID(orderId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }

            ]).toArray()

            resolve(orderItems)

        })
    },
    generateRazorpay: (orderId, totalAmount) => {
        return new Promise(async (resolve, reject) => {
            var options = {
                amount: totalAmount * 100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: "" + orderId
            };
            instance.orders.create(options, function (err, order) {

                if (err) {

                } else {

                    resolve(order)
                }

            });
        })
    },

    verifyPayment: (details) => {

        return new Promise(async (resolve, reject) => {
            const crypto = require("crypto");

            let hmac = crypto.createHmac('sha256', 'OhqR3TLUJutYE39Wco9ntcos')
            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]'])
            hmac = hmac.digest('hex')
            if (hmac == details['payment[razorpay_signature]']) {

                resolve()
            } else {
                reject()
            }
        })
    },
    changePaymentStatus: (orderId) => {

        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectID(orderId) },

                {
                    $set: {
                        status: 'Placed'

                    }
                }
            ).then(() => {
                resolve()
            })
        })
    },
    clearOrder: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).remove({ userId: objectID(userId) }).then((response) => {
                resolve(response)
            })
        })
    }




}