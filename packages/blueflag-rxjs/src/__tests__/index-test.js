// @flow
import {multiCache} from '../index';
import multiCacheOriginal from '../multiCache';

import {zipDiff} from '../index';
import zipDiffOriginal from '../zipDiff';

test('index should export everything', () => {
    expect(multiCache).toBe(multiCacheOriginal);
    expect(zipDiff).toBe(zipDiffOriginal);
});
