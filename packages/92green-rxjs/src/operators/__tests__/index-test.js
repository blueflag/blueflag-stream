// @flow
import {complete} from '../index';
import completeOriginal from '../complete';

test('index should export everything', () => {
    expect(complete).toBe(completeOriginal);
});
