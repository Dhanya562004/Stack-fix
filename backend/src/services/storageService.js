const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const config = require('../config');
const logger = require('../utils/logger');

class StorageService {
  constructor() {
    this.isAws = config.aws.isConfigured;
    this.bucketName = config.aws.s3BucketName;
    this.localDir = path.resolve(__dirname, '../../../.data/storage');
    this.memoryCache = new Map();

    if (this.isAws) {
      try {
        this.s3Client = new S3Client({
          region: config.aws.region,
          credentials: {
            accessKeyId: config.aws.accessKeyId,
            secretAccessKey: config.aws.secretAccessKey
          }
        });
        logger.info('AWS S3 Storage Layer Initialized', { bucket: this.bucketName, region: config.aws.region });
      } catch (err) {
        logger.warn('Failed to initialize AWS S3 client, falling back to local file storage', { error: err.message });
        this.isAws = false;
        this.initLocalStorage();
      }
    } else {
      logger.info('AWS S3 credentials not provided. Using Local Cloud Abstraction Layer Storage');
      this.initLocalStorage();
    }
  }

  initLocalStorage() {
    if (!fs.existsSync(this.localDir)) {
      fs.mkdirSync(this.localDir, { recursive: true });
    }
  }

  /**
   * Save an analysis record to Cloud S3 or Local File System
   */
  async saveAnalysis(id, record) {
    const payload = JSON.stringify(record, null, 2);
    const key = `analyses/${new Date().toISOString().split('T')[0]}/${id}.json`;

    // Always keep in memory cache for ultra-fast lookup
    this.memoryCache.set(id, record);

    if (this.isAws && this.s3Client) {
      try {
        const command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: payload,
          ContentType: 'application/json',
          Metadata: {
            analysisId: id,
            createdAt: new Date().toISOString()
          }
        });
        await this.s3Client.send(command);
        logger.info(`Analysis log saved to AWS S3: ${key}`);
        return { storage: 'aws_s3', key };
      } catch (err) {
        logger.error(`S3 Save failed for ${key}, using local fallback: ${err.message}`);
        return this.saveToLocal(id, key, payload);
      }
    } else {
      return this.saveToLocal(id, key, payload);
    }
  }

  saveToLocal(id, key, payload) {
    try {
      const filename = `${id}.json`;
      const filePath = path.join(this.localDir, filename);
      fs.writeFileSync(filePath, payload, 'utf8');
      logger.info(`Analysis log saved locally: ${filePath}`);
      return { storage: 'local_file_system', path: filePath, id };
    } catch (err) {
      logger.error(`Local file write error: ${err.message}`);
      return { storage: 'memory', id };
    }
  }

  /**
   * Fetch an analysis record by ID
   */
  async getAnalysis(id) {
    if (this.memoryCache.has(id)) {
      return this.memoryCache.get(id);
    }

    const localFile = path.join(this.localDir, `${id}.json`);
    if (fs.existsSync(localFile)) {
      try {
        const raw = fs.readFileSync(localFile, 'utf8');
        const data = JSON.parse(raw);
        this.memoryCache.set(id, data);
        return data;
      } catch (e) {
        logger.error(`Failed to parse local file ${localFile}`);
      }
    }

    return null;
  }

  /**
   * Retrieve list of recent analysis records
   */
  async getRecentAnalyses(limit = 10) {
    // Return sorted memory cache entries first
    const items = Array.from(this.memoryCache.values())
      .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
      .slice(0, limit);

    if (items.length > 0) {
      return items;
    }

    // Read local storage dir if memory is empty
    if (fs.existsSync(this.localDir)) {
      try {
        const files = fs.readdirSync(this.localDir).filter(f => f.endsWith('.json'));
        const records = files.slice(0, limit).map(f => {
          const raw = fs.readFileSync(path.join(this.localDir, f), 'utf8');
          return JSON.parse(raw);
        });
        return records.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
      } catch (err) {
        logger.error(`Failed to read local storage directory: ${err.message}`);
      }
    }

    return [];
  }

  getStorageStatus() {
    return {
      provider: this.isAws ? 'aws_s3' : 'local_file_system',
      bucket: this.bucketName,
      configured: this.isAws,
      cachedCount: this.memoryCache.size
    };
  }
}

module.exports = new StorageService();
