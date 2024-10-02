const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

class FilesController {
    static async postUpload(req, res) {
        const token = req.headers['x-token'];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });

        const userId = await redisClient.get(`auth_${token}`);
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { name, type, parentId = 0, isPublic = false, data } = req.body;

       
        if (!name) return res.status(400).json({ error: 'Missing name' });
        if (!['folder', 'file', 'image'].includes(type)) return res.status(400).json({ error: 'Missing type' });
        if ((type === 'file' || type === 'image') && !data) return res.status(400).json({ error: 'Missing data' });

        let parentFile;
        if (parentId !== 0) {
            parentFile = await dbClient.db.collection('files').findOne({ _id: dbClient.ObjectId(parentId) });
            if (!parentFile) return res.status(400).json({ error: 'Parent not found' });
            if (parentFile.type !== 'folder') return res.status(400).json({ error: 'Parent is not a folder' });
        }

        const fileDocument = {
            userId: dbClient.ObjectId(userId),
            name,
            type,
            isPublic,
            parentId: parentId === 0 ? 0 : dbClient.ObjectId(parentId),
        };

        if (type === 'folder') {
            const newFile = await dbClient.db.collection('files').insertOne(fileDocument);
            return res.status(201).json({
                id: newFile.insertedId,
                userId,
                name,
                type,
                isPublic,
                parentId,
            });
        }

       
        const localPath = path.join(FOLDER_PATH, uuidv4());
        if (!fs.existsSync(FOLDER_PATH)) fs.mkdirSync(FOLDER_PATH, { recursive: true });

        const fileData = Buffer.from(data, 'base64');
        fs.writeFileSync(localPath, fileData);

       
        fileDocument.localPath = localPath;

        const newFile = await dbClient.db.collection('files').insertOne(fileDocument);
        return res.status(201).json({
            id: newFile.insertedId,
            userId,
            name,
            type,
            isPublic,
            parentId,
        });
    }
}

module.exports = FilesController;
