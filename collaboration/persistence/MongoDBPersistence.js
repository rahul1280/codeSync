const mongoose = require('mongoose');
const Y = require('yjs');

const yjsDocumentSchema = new mongoose.Schema(
  {
    docName: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    updates: {
      type: [Buffer],
      default: []
    },
    snapshot: {
      type: Buffer,
      default: null
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false
  }
);

class MongoDBPersistence {
  /**
   * @param {string} connectionString - MongoDB connection URI
   */
  constructor(connectionString) {
    this.connectionString = connectionString;
    this.Model = mongoose.models.YjsDocument || mongoose.model('YjsDocument', yjsDocumentSchema);
    this._connectPromise = null;
    this._queues = new Map();

    if (this.connectionString) {
      this.ensureConnected().catch((err) => {
        console.error('[MongoDBPersistence] Initial connection error:', err.message);
      });
    }
  }

  /**
   * Ensure MongoDB connection is active
   */
  async ensureConnected() {
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }
    if (mongoose.connection.readyState === 2 && this._connectPromise) {
      return this._connectPromise;
    }
    if (!this.connectionString) {
      throw new Error('[MongoDBPersistence] No connectionString provided');
    }

    this._connectPromise = mongoose.connect(this.connectionString);
    try {
      await this._connectPromise;
      return mongoose.connection;
    } finally {
      this._connectPromise = null;
    }
  }

  /**
   * Internal queue to prevent concurrent race conditions per document
   * @param {string} docName
   * @param {Function} task
   */
  _queueOperation(docName, task) {
    const queue = this._queues.get(docName) || Promise.resolve();
    const nextQueue = queue
      .catch(() => {})
      .then(async () => {
        return await task();
      });

    this._queues.set(docName, nextQueue);

    nextQueue.finally(() => {
      if (this._queues.get(docName) === nextQueue) {
        this._queues.delete(docName);
      }
    });

    return nextQueue;
  }

  /**
   * Append a Yjs update to the document's updates array.
   * When updates exceed 50 entries, merges all into a snapshot.
   * @param {string} docName
   * @param {Buffer|Uint8Array} update
   */
  async storeUpdate(docName, update) {
    await this.ensureConnected();

    return this._queueOperation(docName, async () => {
      const updateBuffer = Buffer.isBuffer(update) ? update : Buffer.from(update);

      let doc = await this.Model.findOne({ docName });

      if (!doc) {
        doc = new this.Model({
          docName,
          updates: [updateBuffer],
          snapshot: null,
          updatedAt: new Date()
        });
        await doc.save();
        return;
      }

      doc.updates.push(updateBuffer);
      doc.updatedAt = new Date();

      if (doc.updates.length > 50) {
        const toMerge = [];
        if (doc.snapshot && doc.snapshot.length > 0) {
          toMerge.push(new Uint8Array(doc.snapshot));
        }
        for (const u of doc.updates) {
          if (u && u.length > 0) {
            toMerge.push(new Uint8Array(u));
          }
        }

        if (toMerge.length > 0) {
          const merged = Y.mergeUpdates(toMerge);
          doc.snapshot = Buffer.from(merged);
        }
        doc.updates = [];
      }

      await doc.save();
    });
  }

  /**
   * Fetch Yjs document from database and construct a Y.Doc
   * @param {string} docName
   * @returns {Promise<Y.Doc>}
   */
  async getYDoc(docName) {
    await this.ensureConnected();

    return this._queueOperation(docName, async () => {
      const ydoc = new Y.Doc();
      const docRecord = await this.Model.findOne({ docName });

      if (docRecord) {
        if (docRecord.snapshot && docRecord.snapshot.length > 0) {
          Y.applyUpdate(ydoc, new Uint8Array(docRecord.snapshot));
        }

        if (Array.isArray(docRecord.updates)) {
          for (const u of docRecord.updates) {
            if (u && u.length > 0) {
              Y.applyUpdate(ydoc, new Uint8Array(u));
            }
          }
        }
      }

      return ydoc;
    });
  }

  /**
   * Remove document from database
   * @param {string} docName
   */
  async clearDocument(docName) {
    await this.ensureConnected();
    return this._queueOperation(docName, async () => {
      await this.Model.deleteOne({ docName });
    });
  }

  /**
   * Return all stored document names
   * @returns {Promise<string[]>}
   */
  async getAllDocNames() {
    await this.ensureConnected();
    const docs = await this.Model.find({}, 'docName').lean();
    return docs.map((d) => d.docName);
  }

  /**
   * Close MongoDB connection
   */
  async close() {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  }
}

module.exports = {
  yjsDocumentSchema,
  MongoDBPersistence
};
