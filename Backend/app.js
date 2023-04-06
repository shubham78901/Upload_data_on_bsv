const express = require('express');
const cors = require("cors");
const app = express();

app.use(express.json())


app.use(cors());
const bsv = require('bsv')
const axios = require('axios')
const fs = require('fs').promises;
let txid 
const wocNetwork = 'test'    // The network for the whatsonchain URL - 'main' or 'test'

const bsvNetwork = 'testnet' // The network for BSV library - 'livenet' or 'testnet'

const wifFilename = 'wif.txt'

const myArgs = process.argv.slice(2)

switch (myArgs[0]) {
  case 'generate':
    generate()
    break
  case 'write':
    if (!myArgs[1]) {
      console.log('please supply the text to write to the blockchain.')
      break
    }
    write(myArgs[1])
    break
  default:
    console.log('Usage:\ngenerate: create a wallet\nwrite <txt>: write the given text to the blockchain')
}



async function write(txt) {

  
  // read the wif file
  let wif
  try {
  wif = await fs.readFile(wifFilename)
  } catch(e) {
    console.log('Error reading WIF file')
    console.log(e)
    return
  }
wif = wif.toString() // is a buffer
  if (!wif) {
    console.log('invalid WIF file. Please run generate.')
    return
  }
 
  const privateKey = bsv.PrivateKey.fromWIF(wif)
 
  const publicKeyHash = bsv.crypto.Hash.sha256ripemd160(privateKey.publicKey.toBuffer()).toString('hex')

  const addr = privateKey.toAddress(bsvNetwork).toString()
  
   console.log("Address : " +addr)

  // get UTXOs for the address
  const response = await axios.get(`https://api.whatsonchain.com/v1/bsv/${wocNetwork}/address/${addr}/unspent`)

  const unspentArr = response.data

  

   if (unspentArr.length < 1) {
    console.log('no UTXOs for address ' + addr)
    console.log('get some test coins from to https://faucet.bitcoincloud.net/')
  }
  const unspent = unspentArr[0]

  // create a utxo object
  const utxo = {
    txid: unspent.tx_hash,
    outputIndex: unspent.tx_pos,
    scriptPubKey: bsv.Script.fromASM(`OP_DUP OP_HASH160 ${publicKeyHash} OP_EQUALVERIFY OP_CHECKSIG`).toHex(),
    amount: unspent.value / 1E8
  }

  const tx = new bsv.Transaction()
  tx.from(utxo)

  // add data output
  tx.addSafeData(txt)

  // add change
  tx.addOutput(new bsv.Transaction.Output({
    script: bsv.Script.fromASM(`OP_DUP OP_HASH160 ${publicKeyHash} OP_EQUALVERIFY OP_CHECKSIG`).toHex(),
    satoshis: unspent.value - 50
  }))
  tx.sign(privateKey)

  // submit tx
  const txHex = tx.toString('hex')
  const url = `https://api.whatsonchain.com/v1/bsv/${wocNetwork}/tx/raw`
  const submitResponse = await axios({
    method: 'post',
    url: url,
    data: {
      txhex: txHex
    }
  })

  return  submitResponse.data
}
app.get('/',(req,res)=>
{
 res.send("server started")


})
app.post('/add', async(req, res) => {

 let  wifi=req.body.name;
 console.log(wifi)

 const txid=await write(wifi)
wifi =wifi+" Added sucessfully on blockchain with TXID: "

const data = { message: wifi ,txid}

const jsonData = JSON.stringify(data)

res.setHeader('Content-Type', 'application/json')

res.send(jsonData)


 
})
app.listen(3000);
