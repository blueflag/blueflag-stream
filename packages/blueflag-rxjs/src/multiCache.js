//@flow
import type {Observable} from 'rxjs';

import {merge} from 'rxjs';
import {pipe} from 'rxjs';
import {filter} from 'rxjs/operators';
import {map} from 'rxjs/operators';
import {share} from 'rxjs/operators';

type Id = any;
type Item = any;
type Payload = {
    id: Id,
    item?: ?Item,
    source?: string
};

type Operator<I,O> = (obs: Observable<I>) => Observable<O>;

type Source = {
    name: string,
    load: Operator<Payload,Payload>,
    +save?: ?Operator<Payload,Payload>,
    +clear?: ?Operator<Payload,Payload>
};

type CacheStack = {
    load: Operator<Payload,Payload>,
    clear: Operator<Payload,Payload>
};

const passThrough = ii => ii;

const DEFAULT_ITEM_EXISTS = (item: Item): boolean => item !== undefined && item !== null;

export default (sources: Source[], itemExists: Function = DEFAULT_ITEM_EXISTS): CacheStack => {

    //
    // load operator
    //

    let loadOperator: Operator<Payload,Payload> = sources.reduceRight((innerPipe: ?Operator<Payload,Payload>, source: Source): Operator<Payload,Payload> => {
        return (obs: Observable<Payload>): Observable<Payload> => {

            let filterFound = filter(payload => itemExists(payload.item));
            let filterNotFound = filter(payload => !itemExists(payload.item));
            let setSource = source => map(payload => ({...payload, source}));

            let inputObs = obs.pipe(share());

            let inputFoundObs = inputObs.pipe(
                filterFound,
                setSource('input')
            );

            let loadObs = inputObs.pipe(
                filterNotFound,
                source.load, // load items not found on input
                share()
            );

            let loadFoundObs = loadObs.pipe(
                filterFound,
                setSource(source.name)
            );

            let remainingObs = loadObs.pipe(
                filterNotFound,
                innerPipe
                    ? pipe(
                        innerPipe, // try to get remaining items from the next source in the stack
                        source.save || passThrough // save the result if able to
                    )
                    : passThrough
            );

            return merge(
                inputFoundObs, // found on input
                loadFoundObs, // found after load
                remainingObs // everything else
            );
        };
    }, undefined) || passThrough;

    //
    // clear operator
    //

    let clearOperator: Operator<Payload,Payload> = (obs: Observable<Payload>): Observable<Payload> => {
        return sources.reduceRight((obs: Observable<Payload>, source: Source) => {
            return obs.pipe(
                source.clear || passThrough
            );
        }, obs);
    };

    return {
        load: loadOperator,
        clear: clearOperator
    };
};
