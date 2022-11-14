import { MongoClient } from 'mongodb';
let db;

async function connectToDb(cb) {
  // To access local database
  // const client = new MongoClient('mongodb://127.0.0.1:27017');
  const client = new MongoClient(
    `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@cluster0.ifjsvyb.mongodb.net/?retryWrites=true&w=majority`
  );
  await client.connect();

  db = client.db('react-blog-db');
  cb();
}

export { db, connectToDb };
