import {TestScheduler} from 'rxjs/testing';
import route from '../route';
import {map} from 'rxjs/operators';

describe('complete', () => {

    const testScheduler = new TestScheduler((actual, expected) => {
        expect(actual).toEqual(expected);
    });

    it('routes to the correct operators', () => {

        // This test will actually run *synchronously*
        testScheduler.run(helpers => {
            const {cold, expectObservable, expectSubscriptions} = helpers;

            const e1 =  cold('-a--b--c---|');
            const subs =     '^----------!';
            const expected = '-f--e--d---|';
            let selector = (ii) => ii
            let aRoute = (obs) => obs.pipe(map(ii => 'f'))
            let bRoute = (obs) => obs.pipe(map(ii => 'e'))
            let cRoute = (obs) => obs.pipe(map(ii => 'd'))
            expectObservable(
                e1.pipe(
                    route(selector, {
                        a: aRoute,
                        b: bRoute,
                        c: cRoute
                    })
                )
            ).toBe(expected);

            expectSubscriptions(e1.subscriptions).toBe(subs);
        });
    });

});
