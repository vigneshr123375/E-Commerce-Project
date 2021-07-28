var db = require('../Config/connection')
var collection = require('../Config/collections')
const { PRODUCT_COLLECTION, ADMIN_COLLECTION } = require('../Config/collections')
const collections = require('../Config/collections')
var objectID = require('mongodb').ObjectID
// var url = "mongodb://localhost:27017/";
// var MongoClient = require('mongodb').MongoClient;
// MongoClient.connect(url, function(err, db) {
//     if (err) throw err;
//     var dbo = db.db("shopping");
//     var adminData = { Email: "vigneshrravi1997@gmail.com", Password: "123" };
//     dbo.collection(ADMIN_COLLECTION).insertOne(adminData, function(err, res) {
//       if (err) throw err;
//       console.log("1 document inserted");
//       db.close();
//     });
//   });
module.exports = {
    doLogin: (adminData) => {
        var adminDetails = { Email: "vigneshrravi1997@gmail.com", Password: "123" };
        db.get().collection(collection.ADMIN_COLLECTION).insertOne(adminDetails)
        return new Promise(async (resolve, reject) => {

            let loginStatus = false
            let response = {}
            let admin = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ Email: adminData.Email })
            if (admin) {

                bcrypt.compare(adminData.Password, admin.Password).then((status) => {
                    if (status) {

                        response.admin = admin
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
    addProduct: (product, callback) => {
        /*console.log(product)*/
        // to create collection
        db.get().collection('product').insertOne(product).then((data) => {
            //console.log(data);
            callback(data.ops[0]._id, data.ops[0].Name)
        })
    },
    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    deleteProduct: (prodID) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).removeOne({ _id: objectID(prodID) }).then((response) => {
                resolve(response)
            })
        })
    },
    getProductDetails: (proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectID(proId) }).then((response) => {
                resolve(response)
            })
        })

    },
    updateProduct: (proId, productDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectID(proId) }, {
                $set: {
                    No: productDetails.No,
                    Name: productDetails.Name,
                    Price: productDetails.Price

                }
            }).then((response) => {
                resolve()
            })


        })
    }

}