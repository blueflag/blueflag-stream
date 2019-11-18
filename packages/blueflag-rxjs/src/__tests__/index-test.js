// @flow
import {memoryCache} from '../index';
import memoryCacheOriginal from '../memoryCache';

import {multiCache} from '../index';
import multiCacheOriginal from '../multiCache';

import {zipDiff} from '../index';
import zipDiffOriginal from '../zipDiff';

test('index should export everything', () => {
    expect(memoryCache).toBe(memoryCacheOriginal);
    expect(multiCache).toBe(multiCacheOriginal);
    expect(zipDiff).toBe(zipDiffOriginal);
});
