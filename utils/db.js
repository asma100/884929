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
            console.log('Connected to MongoDB');
        }).catch((err) => {
            console.error('MongoDB connection error:', err);
        });
    }

    isAlive() {
        return Boolean(this.db);
    }

    async nbUsers() {
        try {
            return await this.db.collection('users').countDocuments();
        } catch (error) {
            console.error('Error in nbUsers:', error);
            throw error;
        }
    }

    async nbFiles() {
        try {
            return await this.db.collection('files').countDocuments();
        } catch (error) {
            console.error('Error in nbFiles:', error);
            throw error;
        }
    }
}

const dbClient = new DBClient();
module.exports = dbClient;

