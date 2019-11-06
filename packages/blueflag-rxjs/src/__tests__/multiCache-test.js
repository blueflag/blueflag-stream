// @flow
import {TestScheduler} from 'rxjs/testing';
import multiCache from '../multiCache';

import {map} from 'rxjs/operators';
import {tap} from 'rxjs/operators';

describe('multiCache', () => {

    describe('multiCache.load', () => {

        it('multiCache.load should work with no sources', () => {

            const testScheduler = new TestScheduler((actual, expected) => {
                expect(actual).toEqual(expected);
            });

            testScheduler.run(helpers => {
                const {cold, expectObservable, expectSubscriptions} = helpers;


                const inputObs =  cold('--a-b--|');
                const subs =           '^------!';
                const expected =       '--a-b--|';

                let values = {
                    a: {
                        id: 'a',
                        item: undefined
                    },
                    b: {
                        id: 'b',
                        item: undefined
                    }
                };

                let cache = multiCache([]);

                expectObservable(inputObs.pipe(
                    map(id => ({id})),
                    cache.load,
                )).toBe(expected, values);

                expectSubscriptions(inputObs.subscriptions).toBe(subs);
            });
        });


        it('multiCache.load should load from single source', () => {

            const sourceLoadMock = jest.fn(({id}) => {
                return {
                    id,
                    item: `item-${id}`
                }
            });

            const source = {
                name: 'source',
                load: map(sourceLoadMock)
            };

            const testScheduler = new TestScheduler((actual, expected) => {
                expect(actual).toEqual(expected);
                expect(sourceLoadMock).toHaveBeenCalledTimes(2);
            });

            testScheduler.run(helpers => {
                const {cold, expectObservable, expectSubscriptions} = helpers;


                const inputObs =  cold('--a-b--|');
                const subs =           '^------!';
                const expected =       '--a-b--|';

                let values = {
                    a: {
                        id: 'a',
                        item: 'item-a',
                        source: 'source'
                    },
                    b: {
                        id: 'b',
                        item: 'item-b',
                        source: 'source'
                    }
                };

                let cache = multiCache([source]);

                expectObservable(inputObs.pipe(
                    map(id => ({id})),
                    cache.load,
                )).toBe(expected, values);

                expectSubscriptions(inputObs.subscriptions).toBe(subs);
            });
        });

        it('multiCache.load should only load items missing from input', () => {

            const sourceLoadMock = jest.fn(({id}) => {
                return {
                    id,
                    item: `item-${id}`
                }
            });

            const source = {
                name: 'source',
                load: map(sourceLoadMock)
            };

            const testScheduler = new TestScheduler((actual, expected) => {
                expect(actual).toEqual(expected);
                expect(sourceLoadMock).toHaveBeenCalledTimes(1);
            });

            testScheduler.run(helpers => {
                const {cold, expectObservable, expectSubscriptions} = helpers;

                const inputObs =  cold('--a-b--|');
                const subs =           '^------!';
                const expected =       '--a-b--|';

                let inputItems = {
                    a: 'item-a!'
                };

                let values = {
                    a: {
                        id: 'a',
                        item: 'item-a!',
                        source: 'input'
                    },
                    b: {
                        id: 'b',
                        item: 'item-b',
                        source: 'source'
                    }
                };

                let cache = multiCache([source]);

                expectObservable(inputObs.pipe(
                    map(id => ({id, item: inputItems[id]})),
                    cache.load,
                )).toBe(expected, values);

                expectSubscriptions(inputObs.subscriptions).toBe(subs);
            });
        });

        it('multiCache.load should cope with item not being returned from source', () => {

            const sourceLoadMock = jest.fn(({id}) => {
                return {
                    id,
                    item: undefined // items not found!
                }
            });

            const sourceSaveMock = jest.fn(ii => ii);

            const source = {
                name: 'source',
                load: map(sourceLoadMock),
                save: map(sourceSaveMock)
            };

            const testScheduler = new TestScheduler((actual, expected) => {
                expect(actual).toEqual(expected);
                expect(sourceLoadMock).toHaveBeenCalledTimes(2);
                expect(sourceSaveMock).toHaveBeenCalledTimes(0);
            });

            testScheduler.run(helpers => {
                const {cold, expectObservable, expectSubscriptions} = helpers;

                const inputObs =  cold('--a-b--|');
                const subs =           '^------!';
                const expected =       '--a-b--|';

                let values = {
                    a: {
                        id: 'a',
                        item: undefined,
                        source: undefined
                    },
                    b: {
                        id: 'b',
                        item: undefined,
                        source: undefined
                    }
                };

                let cache = multiCache([source]);

                expectObservable(inputObs.pipe(
                    map(id => ({id})),
                    cache.load,
                )).toBe(expected, values);

                expectSubscriptions(inputObs.subscriptions).toBe(subs);
            });
        });

        it('multiCache.load should load from source if not found on first cache, and save it to first cache', () => {

            const cache1LoadMock = jest.fn(({id}) => {
                return {
                    id,
                    // return undefined for id "b" to simulate b not being found in first cache
                    item: id === 'b' ? undefined : `item-${id}`
                }
            });

            const cache1SaveMock = jest.fn(ii => ii);

            const cache1 = {
                name: 'cache1',
                load: map(cache1LoadMock),
                save: map(cache1SaveMock)
            };

            const sourceLoadMock = jest.fn(({id}) => ({id, item: `item-${id}`}));
            const sourceSaveMock = jest.fn(ii => ii);

            const source = {
                name: 'source',
                load: map(sourceLoadMock),
                save: map(sourceSaveMock)
            };

            const testScheduler = new TestScheduler((actual, expected) => {
                expect(actual).toEqual(expected);
                expect(cache1LoadMock).toHaveBeenCalledTimes(3);
                expect(sourceLoadMock).toHaveBeenCalledTimes(1);

                expect(sourceLoadMock.mock.calls[0][0].id).toBe('b');

                expect(cache1SaveMock).toHaveBeenCalledTimes(1);
                expect(sourceSaveMock).toHaveBeenCalledTimes(0);

                expect(cache1SaveMock.mock.calls[0][0].id).toBe('b');
            });

            testScheduler.run(helpers => {
                const {cold, expectObservable, expectSubscriptions} = helpers;


                const inputObs =  cold('--a-b-c-|');
                const subs =           '^-------!';
                const expected =       '--a-b-c-|';

                let values = {
                    a: {
                        id: 'a',
                        item: 'item-a',
                        source: 'cache1'
                    },
                    b: {
                        id: 'b',
                        item: 'item-b',
                        source: 'source'
                    },
                    c: {
                        id: 'c',
                        item: 'item-c',
                        source: 'cache1'
                    }
                };

                let cache = multiCache([cache1, source]);

                expectObservable(inputObs.pipe(
                    map(id => ({id})),
                    cache.load,
                )).toBe(expected, values);

                expectSubscriptions(inputObs.subscriptions).toBe(subs);
            });
        });

        it('multiCache.load should load from source if not found on first cache, and not save it to first cache if first cache doesnt have a save method', () => {

            const cache1LoadMock = jest.fn(({id}) => {
                return {
                    id,
                    // return undefined for id "b" to simulate b not being found in first cache
                    item: id === 'b' ? undefined : `item-${id}`
                }
            });

            const cache1 = {
                name: 'cache1',
                load: map(cache1LoadMock)
            };

            const sourceLoadMock = jest.fn(({id}) => ({id, item: `item-${id}`}));

            const source = {
                name: 'source',
                load: map(sourceLoadMock)
            };

            const testScheduler = new TestScheduler((actual, expected) => {
                expect(actual).toEqual(expected);
                expect(cache1LoadMock).toHaveBeenCalledTimes(3);
                expect(sourceLoadMock).toHaveBeenCalledTimes(1);
                expect(sourceLoadMock.mock.calls[0][0].id).toBe('b');
            });

            testScheduler.run(helpers => {
                const {cold, expectObservable, expectSubscriptions} = helpers;


                const inputObs =  cold('--a-b-c-|');
                const subs =           '^-------!';
                const expected =       '--a-b-c-|';

                let values = {
                    a: {
                        id: 'a',
                        item: 'item-a',
                        source: 'cache1'
                    },
                    b: {
                        id: 'b',
                        item: 'item-b',
                        source: 'source'
                    },
                    c: {
                        id: 'c',
                        item: 'item-c',
                        source: 'cache1'
                    }
                };

                let cache = multiCache([cache1, source]);

                expectObservable(inputObs.pipe(
                    map(id => ({id})),
                    cache.load,
                )).toBe(expected, values);

                expectSubscriptions(inputObs.subscriptions).toBe(subs);
            });
        });

        it('multiCache.load should load from source if not found on first and second cache, and save it to first and second cache', () => {

            const cache1LoadMock = jest.fn(({id}) => {
                return {
                    id,
                    // "c" is in first cache, all others are not
                    item: id === 'c' ? `item-${id}` : undefined
                }
            });

            const cache1SaveMock = jest.fn(ii => ii);

            const cache1 = {
                name: 'cache1',
                load: map(cache1LoadMock),
                save: map(cache1SaveMock)
            };

            const cache2LoadMock = jest.fn(({id}) => {
                return {
                    id,
                    // "b" is in second cache, all others are not
                    item: id === 'b' ? `item-${id}` : undefined
                }
            });

            const cache2SaveMock = jest.fn(ii => ii);

            const cache2 = {
                name: 'cache2',
                load: map(cache2LoadMock),
                save: map(cache2SaveMock)
            };

            const sourceLoadMock = jest.fn(({id}) => ({id, item: `item-${id}`}));
            const sourceSaveMock = jest.fn(ii => ii);

            const source = {
                name: 'source',
                load: map(sourceLoadMock),
                save: map(sourceSaveMock)
            };

            const testScheduler = new TestScheduler((actual, expected) => {
                expect(actual).toEqual(expected);

                expect(cache1LoadMock).toHaveBeenCalledTimes(3);

                expect(cache2LoadMock).toHaveBeenCalledTimes(2);
                expect(cache2LoadMock.mock.calls[0][0].id).toBe('a');
                expect(cache2LoadMock.mock.calls[1][0].id).toBe('b');

                expect(sourceLoadMock).toHaveBeenCalledTimes(1);
                expect(sourceLoadMock.mock.calls[0][0].id).toBe('a');

                expect(cache2SaveMock).toHaveBeenCalledTimes(1);
                expect(cache2SaveMock.mock.calls[0][0].id).toBe('a');

                expect(cache1SaveMock).toHaveBeenCalledTimes(2);
                expect(cache1SaveMock.mock.calls[0][0].id).toBe('a');
                expect(cache1SaveMock.mock.calls[0][0].item).toBe('item-a');
                expect(cache1SaveMock.mock.calls[1][0].id).toBe('b');
                expect(cache1SaveMock.mock.calls[1][0].item).toBe('item-b');

                expect(sourceSaveMock).toHaveBeenCalledTimes(0);
            });

            testScheduler.run(helpers => {
                const {cold, expectObservable, expectSubscriptions} = helpers;


                const inputObs =  cold('--a-b-c-|');
                const subs =           '^-------!';
                const expected =       '--a-b-c-|';

                let values = {
                    a: {
                        id: 'a',
                        item: 'item-a',
                        source: 'source'
                    },
                    b: {
                        id: 'b',
                        item: 'item-b',
                        source: 'cache2'
                    },
                    c: {
                        id: 'c',
                        item: 'item-c',
                        source: 'cache1'
                    }
                };

                let cache = multiCache([cache1, cache2, source]);

                expectObservable(inputObs.pipe(
                    map(id => ({id})),
                    cache.load,
                )).toBe(expected, values);

                expectSubscriptions(inputObs.subscriptions).toBe(subs);
            });
        });
    });

    describe('multiCache.clear', () => {
        it('multiCache.clear should clear on all sources', () => {

            const cache1LoadMock = jest.fn(ii => ii);
            const cache1SaveMock = jest.fn(ii => ii);
            const cache1ClearMock = jest.fn(ii => ii);

            const cache1 = {
                name: 'cache1',
                load: map(cache1LoadMock),
                save: map(cache1SaveMock),
                clear: map(cache1ClearMock)
            };

            const cache2LoadMock = jest.fn(ii => ii);
            const cache2SaveMock = jest.fn(ii => ii);
            const cache2ClearMock = jest.fn(ii => ii);

            const cache2 = {
                name: 'cache2',
                load: map(cache2LoadMock),
                save: map(cache2SaveMock),
                clear: map(cache2ClearMock)
            };

            const sourceLoadMock = jest.fn(ii => ii);
            const sourceSaveMock = jest.fn(ii => ii);

            const source = {
                name: 'source',
                load: map(sourceLoadMock),
                save: map(sourceSaveMock)
            };

            const testScheduler = new TestScheduler((actual, expected) => {
                expect(actual).toEqual(expected);
                expect(cache1ClearMock).toHaveBeenCalledTimes(2);
                expect(cache1ClearMock.mock.calls[0][0].id).toBe('a');
                expect(cache1ClearMock.mock.calls[1][0].id).toBe('b');

                expect(cache2ClearMock).toHaveBeenCalledTimes(2);
                expect(cache2ClearMock.mock.calls[0][0].id).toBe('a');
                expect(cache2ClearMock.mock.calls[1][0].id).toBe('b');
            });

            testScheduler.run(helpers => {
                const {cold, expectObservable, expectSubscriptions} = helpers;


                const inputObs =  cold('--a-b-|');
                const subs =           '^-----!';
                const expected =       '--a-b-|';

                let values = {
                    a: {
                        id: 'a'
                    },
                    b: {
                        id: 'b'
                    }
                };

                let cache = multiCache([cache1, cache2, source]);

                expectObservable(inputObs.pipe(
                    map(id => ({id})),
                    cache.clear,
                )).toBe(expected, values);

                expectSubscriptions(inputObs.subscriptions).toBe(subs);
            });
        });
    });

});
