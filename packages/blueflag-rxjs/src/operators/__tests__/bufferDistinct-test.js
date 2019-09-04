// @flow
import {TestScheduler} from 'rxjs/testing';
import bufferDistinct from '../bufferDistinct';

describe('bufferDistinct', () => {

    it('bufferDistinct should buffer while predicate returns the same value', () => {

        const testScheduler = new TestScheduler((actual, expected) => {
            expect(actual).toEqual(expected);
        });

        testScheduler.run(helpers => {
            const {cold, expectObservable, expectSubscriptions} = helpers;

            const e1 =  cold('-a-a-b-ccc-aa-|');
            const subs =     '^-------------!';
            const expected = '-----A-B---C--(D|)';

            const values = {
                A: ['a','a'],
                B: ['b'],
                C: ['c','c','c'],
                D: ['a','a']
            };

            expectObservable(
                e1.pipe(bufferDistinct(value => value))
            ).toBe(expected, values);

            expectSubscriptions(e1.subscriptions).toBe(subs);
        });
    });

    it('bufferDistinct should not emit buffer contents if received nothing', () => {

        const testScheduler = new TestScheduler((actual, expected) => {
            expect(actual).toEqual(expected);
        });

        testScheduler.run(helpers => {
            const {cold, expectObservable, expectSubscriptions} = helpers;

            const e1 =  cold('-----|');
            const subs =     '^----!';
            const expected = '-----|';

            expectObservable(
                e1.pipe(bufferDistinct(value => value))
            ).toBe(expected);

            expectSubscriptions(e1.subscriptions).toBe(subs);
        });
    });

    it('bufferDistinct should pass errors through', () => {

        const testScheduler = new TestScheduler((actual, expected) => {
            expect(actual).toEqual(expected);
        });

        testScheduler.run(helpers => {
            const {cold, expectObservable, expectSubscriptions} = helpers;

            const e1 =  cold('-a-a-#-|');
            const subs =     '^----!';
            const expected = '-----#';

            expectObservable(
                e1.pipe(bufferDistinct(value => value))
            ).toBe(expected);

            expectSubscriptions(e1.subscriptions).toBe(subs);
        });
    });

});
