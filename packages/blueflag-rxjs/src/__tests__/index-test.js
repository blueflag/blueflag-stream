// @flow
import {zipDiff} from '../index';
import zipDiffOriginal from '../zipDiff';

test('index should export everything', () => {
    expect(zipDiff).toBe(zipDiffOriginal);
});
