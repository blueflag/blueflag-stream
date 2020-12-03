// @flow
import {TestScheduler} from 'rxjs/testing';
import dataloader, {argsToKey} from '../dataloader';

import {of, from} from 'rxjs';
import {delay, toArray, map, filter} from 'rxjs/operators';

describe('dataloader', () => {

    it('should get items', () => {

        const testScheduler = new TestScheduler((actual, expected) => {
            expect(actual).toEqual(expected);
        });

        testScheduler.run(helpers => {
            const {cold, expectObservable, expectSubscriptions} = helpers;

            const values = {
                a: {
                    args: 'a',
                    id: '"a"',
                    item: {
                        id: 'a',
                        name: 'A'
                    }
                },
                b: {
                    args: 'b',
                    id: '"b"',
                    item: {
                        id: 'b',
                        name: 'B'
                    }
                },
                c: {
                    args: 'c',
                    id: '"c"',
                    item: {
                        id: 'c',
                        name: 'C'
                    }
                },
                d: {
                    args: 'd',
                    id: '"d"',
                    item: {
                        id: 'd',
                        name: 'D'
                    }
                },
                e: {
                    args: 'e',
                    id: '"e"',
                    item: {
                        id: 'e',
                        name: 'E'
                    }
                },
                // not an item!
                f: {
                    args: 'f',
                    id: '"f"',
                    item: undefined
                }
            };

            const requester = (argsArray) => {
                const resultArray = argsArray.map(args => values[args].item).filter(Boolean);
                return of(resultArray).pipe(delay(3));
            };

            const inputObs = cold('-a--bc--a-------------d-a-e-b--------f--------|');
            const subs =          '^---------------------------------------------!';
            const expected =      '-------------(aabc)-----a---b----(de)------f--|';

            expectObservable(
                inputObs.pipe(
                    dataloader(requester, result => result.id, 10, 3)
                )
            ).toBe(expected, values);

            expectSubscriptions(inputObs.subscriptions).toBe(subs);
        });
    });

});

describe('argsToKey', () => {
    it('should produce different outputs for different params', () => {
        expect(argsToKey({a:1,b:2})).toEqual(argsToKey({a:1,b:2}));
        expect(argsToKey({a:1,b:2})).not.toEqual(argsToKey({a:1,b:3}));
        expect(argsToKey({a:1,b:2})).not.toEqual(argsToKey({a:1,b:"2"}));
    });

    it('should treat objects with different orders as the same', () => {
        expect(argsToKey({a:1,b:2,c:3})).toEqual(argsToKey({c:3,b:2,a:1}));
    });

    it('should process deeply', () => {
        expect(argsToKey({bb: true, aa: {a:1,b:2,c:3}})).toEqual(argsToKey({aa: {c:3,b:2,a:1}, bb: true}));
    });

    it('should treat missing keys, keys with null values and keys with undefined values as equivalent', () => {
        expect(argsToKey({a:null,b:1})).toEqual(argsToKey({b:1}));
        expect(argsToKey({a:undefined,b:1})).toEqual(argsToKey({b:1}));
    });

    it('should produce empty string for undefined', () => {
        expect(argsToKey(undefined)).toBe('');
    });
});
