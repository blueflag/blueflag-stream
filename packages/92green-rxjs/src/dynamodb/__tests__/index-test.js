// @flow
import {queryAll} from '../index';
import {batchGetWithRetry} from '../index';
import {batchWriteWithRetry} from '../index';
import queryAllOriginal from '../queryAll';
import batchGetWithRetryOriginal from '../batchGetWithRetry';
import batchWriteWithRetryOriginal from '../batchWriteWithRetry';

test('index should export everything', () => {
    expect(queryAll).toBe(queryAllOriginal);
    expect(batchGetWithRetry).toBe(batchGetWithRetryOriginal);
    expect(batchWriteWithRetry).toBe(batchWriteWithRetryOriginal);
});
