const Blockchain = require('./blockchain');
const uuid = require('uuid/v1');
var express = require('express')
var app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const node_address = uuid().split('-').join('');
const bitcoin = new Blockchain();
 
app.get('/blockchain', function (req, res) {
    res.send(bitcoin);
});

app.post('/transaction', function(req, res) {
    const block_index = bitcoin.createNewTransaction(
        req.body.amount,
        req.body.sender, 
        req.body.recipient
    );
    
    res.json({ note:`Transaction will be added in block ${block_index}.`});
});

app.get('/mine', function(req, res) {
    const last_block = bitcoin.getLastBlock();
    const previous_block_hash = last_block['hash'];
    const current_block_data = {
        transactions: bitcoin.pending_transactions,
        index: last_block['index'] + 1
    };
    const nonce = bitcoin.proofOfWork(previous_block_hash, current_block_data);
    const block_hash = bitcoin.hashBlock(previous_block_hash, current_block_data, nonce);
    const new_block = bitcoin.createNewBlock(nonce, previous_block_hash, block_hash);
    
    bitcoin.createNewTransaction(12.5, '00', node_address);
    
    res.json({
        note: "New block mined successfully",
        block: new_block
    });
});
 
app.listen(process.env.PORT, () => {
    console.log(`Listening on port: ${process.env.PORT}`);
});

