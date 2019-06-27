// @flow
import {TestScheduler} from 'rxjs/testing';
import complete from '../complete';
import {COMPLETE} from '../complete';

describe('complete', () => {

    const testScheduler = new TestScheduler((actual, expected) => {
        expect(actual).toEqual(expected);
    });

    it('complete should emit one item upon complete', () => {

        // This test will actually run *synchronously*
        testScheduler.run(helpers => {
            const {cold, expectObservable, expectSubscriptions} = helpers;

            let values = {d: COMPLETE};

            const e1 =  cold('-a--b--c---|', values);
            const subs =     '^----------!';
            const expected = '-----------(d|)';

            expectObservable(
                e1.pipe(complete())
            ).toBe(expected, values);

            expectSubscriptions(e1.subscriptions).toBe(subs);
        });
    });

});
