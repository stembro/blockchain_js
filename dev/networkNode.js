const Blockchain = require('./blockchain');
const uuid = require('uuid/v1');
const rp = require('request-promise');
var express = require('express')
var app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const port = process.argv[2] || process.env.PORT || 3000; 
const current_node_url = `http://127.0.0.1:${port}`;
const node_address = uuid().split('-').join('');
const bitcoin = new Blockchain(current_node_url);

function isNewNode(new_node_url) {
    return !bitcoin.network_nodes.includes(new_node_url)
    && new_node_url !== bitcoin.current_node_url;
}
 
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
    
    // include block reward for the current miner
    bitcoin.createNewTransaction(12.5, '00', node_address);
    
    const current_block_data = {
        transactions: bitcoin.pending_transactions,
        index: last_block['index'] + 1
    };
    const nonce = bitcoin.proofOfWork(previous_block_hash, current_block_data);
    const block_hash = bitcoin.hashBlock(previous_block_hash, current_block_data, nonce);
    const new_block = bitcoin.createNewBlock(nonce, previous_block_hash, block_hash);
    
    res.json({
        note: "New block mined successfully",
        block: new_block
    });
});

app.post('/register-and-broadcast-node', function (req, res) {
    console.log("register-and-broadcast-node");
    const new_node_url = req.body.newNodeUrl;
    if (!bitcoin.network_nodes.includes(new_node_url)) {
        bitcoin.network_nodes.push(new_node_url);
        const requests = [];
        bitcoin.network_nodes.forEach(network_node_url => {
            const request_options = {
                uri: `${network_node_url}/register-node`,
                method: 'POST',
                body: { newNodeUrl: network_node_url },
                json: true
            };
            requests.push(rp(request_options));
        });

        Promise.all(requests)
            .then(data => {
                const bulk_register_options = { 
                    uri: `${new_node_url}/register-nodes-bulk`,
                    method: 'POST',
                    body: {allNetworkNodes: [...bitcoin.network_nodes, bitcoin.current_node_url]},
                    json: true
                };
                return rp(bulk_register_options);    
            })
            .then(data => {
                res.json({ note: 'New Node registered with network successfully' });
            });
    }
});

app.post('/register-node', function (req, res) {
    console.log("register-node");
    const new_node_url = req.body.newNodeUrl;

    if (isNewNode(new_node_url)) {
        bitcoin.network_nodes.push(new_node_url);
    }

    res.json({ note: 'New node registered successfully.' });
});

app.post('/register-nodes-bulk', function (req, res) {
    const all_network_nodes = req.body.allNetworkNodes;
    all_network_nodes.forEach(new_network_node => {
        if (isNewNode(new_network_node)) {
            bitcoin.network_nodes.push(new_network_node);
        }
    });
    res.json({note: 'Bulk registration successful.' });
});
 
const listener = app.listen(port, "0.0.0.0", () => {
    console.log(`Listening on port: ${port}`);
});

