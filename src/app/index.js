const express = require('express');
const cors = require('cors');
const fs = require('fs');
const fsExtra = require('fs-extra');
const JSZip = require('jszip');
const path = require('path');
require('dotenv').config();

const { gerarQRCode, validateQRCode, listarQRCodes, deletarQRCode, gerarImagemQRCode } = require('./services/qrcode.services');
const { login } = require('./services/user.service');

const app = express();

app.use(express.static('pages'));
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/pages/login.html');
});

app.get('/home', (req, res) => {
  res.sendFile(__dirname + '/pages/index.html');
});

app.get('/listar', (req, res) => {
  res.sendFile(__dirname + '/pages/listar.html');
});

app.post('/user/login', (req, res) => {
  let userName = req.body.userName;
  let password = req.body.password;

  let result = login(userName, password);

  res.status(200).send(JSON.stringify({ success: result }));
});

app.post('/qrcode', async (req, res) => {
    try{
      const zip = new JSZip();
      const nomeZip = 'QRCodes.zip';
      const filePath = 'src/qrcodes/';
      
      let quantidade = req.body.quantidade;
      let reponsavel = req.body.responsavel;
      
      for(let i = 0; i < quantidade; i++){
        let nomeArquivo = await gerarQRCode(filePath, reponsavel);
        let fileContent = await fs.promises.readFile(filePath + nomeArquivo);
        zip.file(nomeArquivo, fileContent);
      }

      const zipContent = await zip.generateAsync({type: 'nodebuffer'});

      res.set(`Content-Disposition', 'attachment; filename=${nomeZip}`);
      res.set('Content-Type', 'application/zip');
      res.send(zipContent);

      await fsExtra.emptyDir(filePath);
    }
    catch (ex){
      console.log(ex);
    }
});

app.get('/qrcode', async (req, res) => {
  res.status(200).json(await listarQRCodes());
});

app.get('/qrcode/:id', async (req, res) => {
  let idQrCode = req.params.id;
  let result = await gerarImagemQRCode(idQrCode)

  if(result != null){
    res.sendFile(path.resolve(result));
  }
  else{
    res.status(404).send(JSON.stringify({ success: false }));
  }

  await fsExtra.emptyDir('src/qrcodes/');
});

app.get('/qrcode/:id/validate', async (req, res) => {
  let idQrCode = req.params.id;
  let result = await validateQRCode(idQrCode)

  if(result) res.sendFile(__dirname + '/pages/successValidation.html');
  else res.sendFile(__dirname + '/pages/failureValidation.html');
});

app.delete('/qrcode/:id', async (req, res) => {
  let idQrCode = req.params.id;

  let result = await deletarQRCode(idQrCode);

  if(!result) return res.status(404).send(JSON.stringify({ success: result }));

  res.status(200).send(JSON.stringify({ success: result }));
});

app.listen(process.env.PORT ?? 6700, () => {
  console.log(`Server is running on port ${process.env.PORT ?? 6700} 🚀`);
});
