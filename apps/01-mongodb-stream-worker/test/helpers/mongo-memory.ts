import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, Document } from 'mongodb';

// Define test document interface
interface TestDocument extends Document {
  name: string;
  value: number;
}

let mongoServer: MongoMemoryServer;
let mongoClient: MongoClient;

export const setupMongoMemoryServer = async (): Promise<{
  uri: string;
  client: MongoClient;
}> => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  mongoClient = new MongoClient(uri);
  await mongoClient.connect();

  return { uri, client: mongoClient };
};

export const teardownMongoMemoryServer = async (): Promise<void> => {
  if (mongoClient) {
    await mongoClient.close();
  }

  if (mongoServer) {
    await mongoServer.stop();
  }
};

export const createTestCollection = async (
  client: MongoClient,
  dbName: string,
  collectionName: string
): Promise<void> => {
  const db = client.db(dbName);
  await db.createCollection(collectionName);

  const documents: TestDocument[] = [
    { name: 'Document 1', value: 100 },
    { name: 'Document 2', value: 200 }
  ];

  await db.collection<TestDocument>(collectionName).insertMany(documents);
};
