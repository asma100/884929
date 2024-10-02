const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

class UsersController {
    static async getMe(req, res) {
        const token = req.headers['x-token'];

        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userId = await redisClient.get(`auth_${token}`);

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        try {
            const user = await dbClient.db.collection('users').findOne({ _id: dbClient.ObjectId(userId) }, { projection: { email: 1 } });

            if (!user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            return res.status(200).json({ id: user._id, email: user.email });
        } catch (error) {
            console.error('Error retrieving user:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

module.exports = UsersController;
