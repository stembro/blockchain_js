const sha256 = require('sha256');  

class Blockchain {
    constructor() {
        this.chain = [];
        this.pending_transactions = [];
        this.createNewBlock(100, '0', '0')
    }
    
    hashBlock(previous_block_hash, current_block_data, nonce) {
        const data_str = `${previous_block_hash}${nonce.tostring()}${JSON.stringify(current_block_data)}`;
        const hash = sha256(data_str);
        return hash;
    }
    
    proofOfWork(previous_block_hash, current_block_data) {
        let nonce = 0;
        let hash = this.hashBlock(previous_block_hash, current_block_data, nonce);
        while (hash.substring(0,4) !== '0000') {
            hash = this.hashBlock(previous_block_hash, current_block_data, ++nonce);
        }
        return nonce;
    }
    
    createNewBlock(nonce, previous_block_hash, hash) {
        const new_block = {
            index: this.chain.length + 1,
            timestamp: Date.now(),
            transactions: this.pending_transactions,
            nonce,
            hash,
            previous_block_hash
        };
        
        this.pending_transactions = [];
        
        this.chain.push(new_block);
        return new_block;
    }
    
    getLastBlock() {
        return this.chain[this.chain.length -1];
    }
    
    createNewTransaction(amount, sender, recipient) {
        const new_transaction = {
            amount,
            sender,
            recipient
        };
        
        this.pending_transactions.push(new_transaction);
        return this.getLastBlock()['index'] + 1;
    }
}

module.exports = Blockchain;