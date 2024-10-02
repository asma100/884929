const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');
const { v4: uuidv4 } = require('uuid');
const sha1 = require('sha1');

class AuthController {
    static async getConnect(req, res) {
        const authHeader = req.headers.authorization || '';
        const base64Credentials = authHeader.split(' ')[1] || '';
        const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
        const [email, password] = credentials.split(':');

        if (!email || !password) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        try {
            const hashedPassword = sha1(password);
            const user = await dbClient.db.collection('users').findOne({ email, password: hashedPassword });

            if (!user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const token = uuidv4();
            await redisClient.set(`auth_${token}`, user._id.toString(), 24 * 60 * 60);  // Store token for 24 hours
            return res.status(200).json({ token });
        } catch (error) {
            console.error('Error during authentication:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async getDisconnect(req, res) {
        const token = req.headers['x-token'];

        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userId = await redisClient.get(`auth_${token}`);

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        await redisClient.del(`auth_${token}`);
        return res.status(204).send();
    }
}

module.exports = AuthController;
