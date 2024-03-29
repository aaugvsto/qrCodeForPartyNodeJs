const QRCode = require('qrcode');
const {MongoClient, ObjectId} = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_BD_URI;
const client = new MongoClient(uri).db('QRCodes').collection('QRCodesLog');

async function gerarQRCode(filePath, reponsavel) {
  try {
    let date = formatarData(new Date());    
    let document = await client.insertOne({ validated: false, creationDate: date, responsible: reponsavel, validationDate: ''});
    let nomeArquivo = `${document.insertedId}.png`;

    await QRCode.toFile(filePath + nomeArquivo, `${document.insertedId}`);

    return nomeArquivo;
  } catch (err) {
    console.error(err);
  }
}

async function validateQRCode(id){
  let document = await client.findOne({ _id: new ObjectId(id) });

  if(document == null) return null;

  if(document.validated) return false;

  let date = formatarData();
  await client.updateOne({ _id: new ObjectId(id) }, { $set: { validated: true, validationDate: date } });

  return true;
}

async function listarQRCodes(){
  let documents = await client.find({}).toArray();
  return documents;
}

async function deletarQRCode(id){
  let res = await client.deleteOne({ _id: new ObjectId(id) });
  return res.deletedCount > 0;
}

async function gerarImagemQRCode(idQrCode) {
  let qrCode = client.findOne({ _id: new ObjectId(idQrCode) });
  let filePath = null;

  if(qrCode) {
    filePath = `src/qrcodes/${idQrCode}.png`;
    await QRCode.toFile(filePath, `${idQrCode}`);
  }

  return filePath;
}

function formatarData(data){
  let date = data ?? new Date();
  let day = date.getDate().toString().padStart(2, '0');
  let month = (date.getMonth() + 1).toString().padStart(2, '0');
  let year = date.getFullYear();
  let hours = date.getHours().toString().padStart(2, '0');
  let minutes = date.getMinutes().toString().padStart(2, '0');
  let seconds = date.getSeconds().toString().padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

module.exports = {gerarQRCode, validateQRCode, listarQRCodes, deletarQRCode, gerarImagemQRCode};