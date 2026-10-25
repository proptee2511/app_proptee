const { MongoClient } = require('mongodb');
async function check() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017', { serverSelectionTimeoutMS: 5000 });
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'cashflow_proptee');
    await db.command({ ping: 1 });
    const collections = [];
    for (const { name } of await db.listCollections({}, { nameOnly: true }).toArray()) {
      collections.push({ name, documents: await db.collection(name).countDocuments({}), indexes: (await db.collection(name).indexes()).map(index => index.name) });
    }
    console.log(JSON.stringify({ status: 'connected', database: db.databaseName, collections }, null, 2));
  } finally { await client.close(); }
}
check().catch(error => { console.error(`MongoDB check failed (${error.code || error.name}). Check MONGODB_URI and local server status.`); process.exitCode = 1; });
