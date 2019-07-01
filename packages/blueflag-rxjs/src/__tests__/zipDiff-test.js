// @flow
import {TestScheduler} from 'rxjs/testing';
import zipDiff from '../zipDiff';

describe('zipDiff', () => {

    it('zipDiff should emit items when they match', () => {

        const testScheduler = new TestScheduler((actual, expected) => {
            expect(actual).toEqual(expected);
        });

        testScheduler.run(helpers => {
            const {cold, expectObservable, expectSubscriptions} = helpers;

            let values = {
                x: {
                    a: 'x',
                    b: 'x'
                },
                y: {
                    a: 'y',
                    b: 'y'
                }
            };

            const a =   cold('-x-----y---|');
            const b =   cold('---y-x-----|');
            const subs =     '^----------!';
            const expected = '-----x-y---|';

            expectObservable(
                zipDiff(a, b, ii => ii)
            ).toBe(expected, values);

            expectSubscriptions(a.subscriptions).toBe(subs);
            expectSubscriptions(b.subscriptions).toBe(subs);
        });
    });

    it('zipDiff should emit items that dont have matches once an input observable is finished', () => {

        const testScheduler = new TestScheduler((actual, expected) => {
            expect(actual).toEqual(expected);
        });

        testScheduler.run(helpers => {
            const {cold, expectObservable, expectSubscriptions} = helpers;

            let values = {
                x: {
                    a: 'x',
                    b: 'x'
                },
                y: {
                    a: 'y'
                },
                z: {
                    b: 'z'
                }
            };

            const a =   cold('-----x-y---|');
            const b =   cold('-x-z-------|');
            const subs =     '^----------!';
            const expected = '-----x-----(yz|)';

            expectObservable(
                zipDiff(a, b, ii => ii)
            ).toBe(expected, values);

            expectSubscriptions(a.subscriptions).toBe(subs);
            expectSubscriptions(b.subscriptions).toBe(subs);
        });
    });

    it('zipDiff should emit items that will never have matches when an input observable finishes', () => {

        const testScheduler = new TestScheduler((actual, expected) => {
            expect(actual).toEqual(expected);
        });

        testScheduler.run(helpers => {
            const {cold, expectObservable, expectSubscriptions} = helpers;

            let values = {
                w: {
                    b: 'w'
                },
                x: {
                    a: 'x'
                },
                y: {
                    b: 'y'
                },
                z: {
                    a: 'z'
                }
            };

            const a =   cold('--x-z---|       ');
            const asubs =    '^-------!       ';
            const b =   cold('------y----w---|');
            const bsubs =    '^--------------!';
            const expected = '--------y--w---(xz|)';

            expectObservable(
                zipDiff(a, b, ii => ii)
            ).toBe(expected, values);

            expectSubscriptions(a.subscriptions).toBe(asubs);
            expectSubscriptions(b.subscriptions).toBe(bsubs);
        });
    });

    it('zipDiff should accept a keyBy function', () => {

        const testScheduler = new TestScheduler((actual, expected) => {
            expect(actual).toEqual(expected);
        });

        testScheduler.run(helpers => {
            const {cold, expectObservable, expectSubscriptions} = helpers;

            let inputValuesA = {
                x: {
                    id: 'X',
                    name: 'Xylophone'
                },
                y: {
                    id: 'Y',
                    name: 'Yellow'
                }
            };

            let inputValuesB = {
                x: {
                    id: 'X',
                    name: 'Xray'
                },
                y: {
                    id: 'Y',
                    name: 'Yak'
                }
            };

            let outputValues = {
                x: {
                    a: {
                        id: 'X',
                        name: 'Xylophone'
                    },
                    b: {
                        id: 'X',
                        name: 'Xray'
                    }
                },
                y: {
                    a: {
                        id: 'Y',
                        name: 'Yellow'
                    },
                    b: {
                        id: 'Y',
                        name: 'Yak'
                    }
                }
            };

            const a =   cold('-x-----y---|', inputValuesA);
            const b =   cold('---y-x-----|', inputValuesB);
            const subs =     '^----------!';
            const expected = '-----x-y---|';

            expectObservable(
                zipDiff(a, b, ii => ii.id)
            ).toBe(expected, outputValues);

            expectSubscriptions(a.subscriptions).toBe(subs);
            expectSubscriptions(b.subscriptions).toBe(subs);
        });
    });

    it('zipDiff should accept two keyBy functions to uise on each input observable', () => {

        const testScheduler = new TestScheduler((actual, expected) => {
            expect(actual).toEqual(expected);
        });

        testScheduler.run(helpers => {
            const {cold, expectObservable, expectSubscriptions} = helpers;

            let inputValuesA = {
                x: {
                    id: 'X',
                    name: 'Xylophone'
                },
                y: {
                    id: 'Y',
                    name: 'Yellow'
                }
            };

            let inputValuesB = {
                x: {
                    foo: 'X',
                    name: 'Xray'
                },
                y: {
                    foo: 'Y',
                    name: 'Yak'
                }
            };

            let outputValues = {
                x: {
                    a: {
                        id: 'X',
                        name: 'Xylophone'
                    },
                    b: {
                        foo: 'X',
                        name: 'Xray'
                    }
                },
                y: {
                    a: {
                        id: 'Y',
                        name: 'Yellow'
                    },
                    b: {
                        foo: 'Y',
                        name: 'Yak'
                    }
                }
            };

            const a =   cold('-x-----y---|', inputValuesA);
            const b =   cold('---y-x-----|', inputValuesB);
            const subs =     '^----------!';
            const expected = '-----x-y---|';

            expectObservable(
                zipDiff(a, b, ii => ii.id, ii => ii.foo)
            ).toBe(expected, outputValues);

            expectSubscriptions(a.subscriptions).toBe(subs);
            expectSubscriptions(b.subscriptions).toBe(subs);
        });
    });

    it('zipDiff should dedupe identical keys from same input observable', () => {

        const testScheduler = new TestScheduler((actual, expected) => {
            expect(actual).toEqual(expected);
        });

        testScheduler.run(helpers => {
            const {cold, expectObservable, expectSubscriptions} = helpers;

            let values = {
                x: {
                    a: 'x',
                    b: 'x'
                }
            };

            const a =   cold('-x-x-------|');
            const b =   cold('------x----|');
            const subs =     '^----------!';
            const expected = '------x----|';

            expectObservable(
                zipDiff(a, b, ii => ii)
            ).toBe(expected, values);

            expectSubscriptions(a.subscriptions).toBe(subs);
            expectSubscriptions(b.subscriptions).toBe(subs);
        });
    });

});
