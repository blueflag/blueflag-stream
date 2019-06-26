// @flow
import {queryAll} from '../index';
import queryAllOriginal from '../queryAll';

test('index should export everything', () => {
    expect(queryAll).toBe(queryAllOriginal);
});
