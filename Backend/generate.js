const bsv = require('bsv')
const axios = require('axios')
const fs = require('fs').promises;

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

// generate testnet wallet
function generate () {
  const privateKey = bsv.PrivateKey()
  const wif = privateKey.toWIF()
  const addr = privateKey.toAddress(bsvNetwork).toString() 
  
  // we will overwrite any existing wif file
  fs.writeFile(wifFilename, wif, function(err) {
    if (err) {
       return console.error(err)
    }
  })
  console.log('Your WIF:     ' + wif)
  console.log('Your address: ' + addr)
  console.log('Your Private key: '+ privateKey)

}



generate ()
