// @flow
import {queryAll} from '../index';
import {batchWriteWithRetry} from '../index';
import queryAllOriginal from '../queryAll';
import batchWriteWithRetryOriginal from '../batchWriteWithRetry';

test('index should export everything', () => {
    expect(queryAll).toBe(queryAllOriginal);
    expect(batchWriteWithRetry).toBe(batchWriteWithRetryOriginal);
});
