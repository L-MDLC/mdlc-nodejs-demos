import { MongoClient, Collection, ObjectId, ChangeStreamUpdateDocument } from 'mongodb';
import { setupMongoMemoryServer, teardownMongoMemoryServer } from './helpers/mongo-memory';
import { mongoDbService } from '../src/services/mongodb.service';
import { changeStreamService } from '../src/services/change-stream.service';
import { changeHandler } from '../src/handlers/change-handler';

// Define document types for testing
interface TestDocument {
  _id?: ObjectId;
  name: string;
  value: number;
  updated?: boolean;
}

jest.mock('../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn()
  }
}));

describe('MongoDB Change Stream Integration', () => {
  let mongoClient: MongoClient;
  let collection: Collection<TestDocument>;

  beforeAll(async () => {
    const { uri, client } = await setupMongoMemoryServer();
    mongoClient = client;

    jest.mock('../src/config/config', () => ({
      config: {
        mongodb: {
          uri: uri,
          dbName: 'test',
          collectionName: 'documents'
        },
        worker: {
          reconnectInterval: 1000,
          maxReconnectAttempts: 3
        },
        log: {
          level: 'info'
        }
      }
    }));

    const db = mongoClient.db('test');
    await db.createCollection('documents');
    collection = db.collection<TestDocument>('documents');
  });

  afterAll(async () => {
    await changeStreamService.closeChangeStream();
    await mongoDbService.close();
    await teardownMongoMemoryServer();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should detect document insertions', async () => {
    const handleChangeSpy = jest.spyOn(changeHandler, 'handleChange');

    await mongoDbService.connect();
    await changeStreamService.setupChangeStream();
    await new Promise<void>(resolve => setTimeout(resolve, 500));

    const docToInsert: TestDocument = { name: 'Test Document', value: 42 };
    await collection.insertOne(docToInsert);

    await new Promise<void>(resolve => setTimeout(resolve, 500));

    expect(handleChangeSpy).toHaveBeenCalled();

    const changeEvent = handleChangeSpy.mock.calls[0][0];
    expect(changeEvent.operationType).toBe('insert');

    // Only access fullDocument on insert operations
    if (changeEvent.operationType === 'insert') {
      expect(changeEvent.fullDocument.name).toBe('Test Document');
      expect(changeEvent.fullDocument.value).toBe(42);
    }
  });

  test('should detect document updates', async () => {
    const handleChangeSpy = jest.spyOn(changeHandler, 'handleChange');
    handleChangeSpy.mockClear();

    const result = await collection.insertOne({ name: 'Update Test', value: 10 });
    const docId = result.insertedId;

    await new Promise<void>(resolve => setTimeout(resolve, 500));
    handleChangeSpy.mockClear();

    await collection.updateOne(
      { _id: docId },
      { $set: { value: 20, updated: true } }
    );

    await new Promise<void>(resolve => setTimeout(resolve, 500));

    expect(handleChangeSpy).toHaveBeenCalled();

    const changeEvent = handleChangeSpy.mock.calls[0][0];
    expect(changeEvent.operationType).toBe('update');

    // Cast to ChangeStreamUpdateDocument to access updateDescription
    if (changeEvent.operationType === 'update') {
      const updateEvent = changeEvent as ChangeStreamUpdateDocument<TestDocument>;
      expect(updateEvent.updateDescription.updatedFields.value).toBe(20);
      expect(updateEvent.updateDescription.updatedFields.updated).toBe(true);
    }
  });

  test('should detect document deletions', async () => {
    const handleChangeSpy = jest.spyOn(changeHandler, 'handleChange');
    handleChangeSpy.mockClear();

    const result = await collection.insertOne({ name: 'Delete Test', value: 30 });
    const docId = result.insertedId;

    await new Promise<void>(resolve => setTimeout(resolve, 500));
    handleChangeSpy.mockClear();

    await collection.deleteOne({ _id: docId });

    await new Promise<void>(resolve => setTimeout(resolve, 500));

    expect(handleChangeSpy).toHaveBeenCalled();

    const changeEvent = handleChangeSpy.mock.calls[0][0];
    expect(changeEvent.operationType).toBe('delete');

    // Only check documentKey on delete operations
    if (changeEvent.operationType === 'delete') {
      expect(changeEvent.documentKey._id).toEqual(docId);
    }
  });
});
