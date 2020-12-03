// @flow
import {TestScheduler} from 'rxjs/testing';
import dataloader, {argsToKey} from '../dataloader';

import {of, from} from 'rxjs';
import {delay, toArray, map, filter, mergeMap} from 'rxjs/operators';

jest.useFakeTimers()

describe('dataloader', () => {

    it('should load items', () => {

        const testScheduler = new TestScheduler((actual, expected) => {
            expect(actual).toEqual(expected);
        });

        testScheduler.run(helpers => {
            const {cold, expectObservable, expectSubscriptions} = helpers;

            const values = {
                a: {
                    id: 'a',
                    name: 'A'
                },
                b: {
                    id: 'b',
                    name: 'B'
                },
                c: {
                    id: 'c',
                    name: 'C'
                },
                d: {
                    id: 'd',
                    name: 'D'
                },
                e: {
                    id: 'e',
                    name: 'E'
                },
                // not an item!
                f: undefined
            };

            const inputObs = cold('-a--bc--a-------------d-a-e-b--------f--------|');
            const subs =          '^---------------------------------------------!';
            const expected =      '-------------(aabc)-----a---b----(de)------f--|';

            const thingLoader = dataloader({
                loader: (argsArray) => {
                    const resultArray = argsArray.map(args => values[args]).filter(Boolean);
                    return of(resultArray).pipe(delay(3));
                },
                getArgsFromData: result => result.id,
                bufferTime: 10,
                batchSize: 3,
                maxItems: 1000
            });

            expectObservable(
                inputObs.pipe(
                    thingLoader.load
                )
            ).toBe(expected, values);

            expectSubscriptions(inputObs.subscriptions).toBe(subs);
        });
    });

    it.only('should load items and share cache even when used in different pipes', () => {

        const testScheduler = new TestScheduler((actual, expected) => {
            expect(actual).toEqual(expected);
        });

        testScheduler.run(helpers => {
            const {cold, expectObservable, expectSubscriptions} = helpers;

            const values = {
                a: {
                    id: 'a',
                    name: 'A'
                },
                b: {
                    id: 'b',
                    name: 'B'
                },
                c: {
                    id: 'c',
                    name: 'C'
                },
                d: {
                    id: 'd',
                    name: 'D'
                },
                e: {
                    id: 'e',
                    name: 'E'
                },
                // not an item!
                f: undefined
            };

            // const inputObs = cold('-a--bc--a-------------d-a-e-b--------f--------|');
            // const subs =          '^---------------------------------------------!';
            // const expected =      '-------------(aabc)-----a---b----(de)------f--|';

            const inputObs = cold('-a---|');
            const subs =          '^----!';
            const expected =      '-----|';

            console.log('/');

            const thingLoader = dataloader({
                loader: (argsArray) => {
                    console.log('argsArray', argsArray);
                    const resultArray = argsArray.map(args => values[args]).filter(Boolean);
                    return of(resultArray).pipe(delay(3));
                },
                getArgsFromData: result => result.id,
                bufferTime: 10,
                batchSize: 3,
                maxItems: 1000
            });

            expectObservable(
                inputObs.pipe(
                    mergeMap((args) => of(args).pipe(
                        thingLoader.load
                    ))
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
