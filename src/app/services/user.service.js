const {MongoClient, ObjectId} = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_BD_URI;
const client = new MongoClient(uri).db('QRCodes').collection('Users');

async function login(userName, password){
    let user = await client.findOne({ userName: userName, password: password }, function(err, result) {});
    return user != null;
}

module.exports = { login };