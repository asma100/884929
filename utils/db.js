const { MongoClient } = require('mongodb');
const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || 27017;
const database = process.env.DB_DATABASE || 'files_manager';
const url = `mongodb://${host}:${port}`;
class DBClient {
    constructor() {
        this.client = new MongoClient(url, { useUnifiedTopology: true });

        this.client.connect().then(() => {
            this.db = this.client.db(database);
            this.db.createCollection('users');
            this.db.createCollection('files');
            console.log('Connected to MongoDB');
        }).catch((err) => {
            console.error('MongoDB connection error:', err);
        });
    }

    isAlive() {
        return  this.client.isConnected();
    }

    async nbUsers() {
        return this.db.collection('users').countDocuments();

    }

    async nbFiles() {
        return this.db.collection('files').countDocuments();
    }
}

const dbClient = new DBClient();
module.exports = dbClient;


