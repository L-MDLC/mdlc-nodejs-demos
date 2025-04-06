import {
  ChangeStreamDocument,
  ChangeStreamInsertDocument,
  ChangeStreamUpdateDocument,
  ChangeStreamDeleteDocument,
} from 'mongodb';
import { changeHandler } from '../../src/handlers/change-handler';
import { logger } from '../../src/utils/logger';

interface TestDocument {
  _id: string;
  name: string;
  value: number;
  updated?: boolean;
}

jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn()
  }
}));

describe('Change Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('handleChange should process insert operations', () => {
    const mockInsertChange: Partial<ChangeStreamInsertDocument<TestDocument>> = {
      _id: { _data: 'test-resume-token' },
      operationType: 'insert',
      fullDocument: { _id: 'doc1', name: 'Test Document', value: 100 },
      ns: { db: 'testdb', coll: 'testcoll' },
      documentKey: { _id: 'doc1' }
    };

    changeHandler.handleChange(mockInsertChange as ChangeStreamDocument<TestDocument>);

    expect(changeHandler.getResumeToken()).toEqual({ _data: 'test-resume-token' });
    expect(logger.info).toHaveBeenCalledWith('Change detected of type: insert');
    expect(logger.info).toHaveBeenCalledWith('New document inserted');
  });

  test('handleChange should process update operations', () => {
    const mockUpdateChange: Partial<ChangeStreamUpdateDocument<TestDocument>> = {
      _id: { _data: 'update-token' },
      operationType: 'update',
      updateDescription: {
        updatedFields: { value: 200, updated: true },
        removedFields: ['oldField'],
        truncatedArrays: []
      },
      ns: { db: 'testdb', coll: 'testcoll' },
      documentKey: { _id: 'doc1' }
    };

    changeHandler.handleChange(mockUpdateChange as ChangeStreamDocument<TestDocument>);

    expect(changeHandler.getResumeToken()).toEqual({ _data: 'update-token' });
    expect(logger.info).toHaveBeenCalledWith('Change detected of type: update');
    expect(logger.debug).toHaveBeenCalledWith('Updated fields:', mockUpdateChange.updateDescription?.updatedFields);
  });

  test('handleChange should process delete operations', () => {
    const mockDeleteChange: Partial<ChangeStreamDeleteDocument<TestDocument>> = {
      _id: { _data: 'delete-token' },
      operationType: 'delete',
      ns: { db: 'testdb', coll: 'testcoll' },
      documentKey: { _id: 'doc1' }
    };

    changeHandler.handleChange(mockDeleteChange as ChangeStreamDocument<TestDocument>);

    expect(changeHandler.getResumeToken()).toEqual({ _data: 'delete-token' });
    expect(logger.info).toHaveBeenCalledWith('Document deleted');
  });

  test('setResumeToken should override the stored token', () => {
    const testToken = { _data: 'manual-token' };
    changeHandler.setResumeToken(testToken);

    expect(changeHandler.getResumeToken()).toEqual(testToken);
  });
});
