//@flow
import type {Observable} from 'rxjs';
import memoryCache from './memoryCache';
import zipDiff from './zipDiff';
import {merge, of, from} from 'rxjs';
import {map, mergeMap, share, bufferCount, bufferTime, filter, concatMap, toArray} from 'rxjs/operators';

// argsToKey taken from mobx-fog-of-war
// safely stringifies JSON.stringifiable arguments into ids

export const argsToKey = (args: unknown): string => {
    // process only collections (objects and arrays)
    if (args instanceof Object) {
        // make entries
        const entries: Array<[number|string, unknown]> = [];
        for (const key in args) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const value: unknown = args[key];
            if(value !== undefined && value !== null) {
                entries.push([key, value]);
            }
        }
        // sort by key so differences in key order don't produce different results
        entries.sort((a, b) => a[0] < b[0] ? -1 : 1);
        // recurse to children
        args = entries.map(([key, value]) => [key, argsToKey(value)]);
    }
    // stringify result
    return JSON.stringify(args) || '';
};

type Operator<A,B> = (obs: Observable<A>) => Observable<B>;

type Payload<I> = {
    item?: I,
    id: string,
    args: any
};

type Loader<A,I> = (args: A) => Promise<I>|Observable<I>;

type GetArgsFromData = (data: any) => any;

type Config = {
    bufferTime?: number
};

export default function<A,I>(loader: Loader<A,I>, getArgsFromData: GetArgsFromData, timeToBuffer: number, batchSize: number): Operator<A,I> {

    const cache = memoryCache();

    return (argsObs: Observable<A>): Observable<O> => {

        const loadObs = argsObs.pipe(
            map(args => ({
                args,
                id: argsToKey(args)
            })),
            cache.load,
            share()
        );

        const foundObs = loadObs.pipe(
            filter(payload => payload.item !== undefined)
        );

        const notFoundObs = loadObs.pipe(
            filter(payload => payload.item === undefined),
            bufferTime(timeToBuffer),
            mergeMap((payloads: Payload<I>[]) => from(payloads).pipe(
                bufferCount(batchSize)
            )),
            concatMap((payloads: Payload<I>[]): Observable<Payload<I>> => from(payloads).pipe(
                map(payload => payload.args),
                toArray(),
                mergeMap(loader),
                mergeMap((results: I[]): Observable<Payload<I>> => {

                    const itemsMap = new Map<string,I>(results.map(result => [
                        argsToKey(getArgsFromData(result)),
                        result
                    ]));

                    return from(payloads).pipe(
                        map(payload => ({
                            ...payload,
                            item: itemsMap.get(payload.id)
                        }))
                    );
                })
            )),
            cache.save
        );

        return merge(foundObs, notFoundObs).pipe(map(payload => payload.item));
    };
}
