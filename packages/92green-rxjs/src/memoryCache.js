//@flow
import type {Observable} from 'rxjs';

import {of} from 'rxjs';
import {AsyncSubject} from 'rxjs';
import {flatMap} from 'rxjs/operators';
import {map} from 'rxjs/operators';
import {LRUMap} from 'lru_map';

type Id = any;
type Item = any;
type Payload = {
    id: Id,
    item?: ?Item
};

type Operator<I,O> = (obs: Observable<I>) => Observable<O>;

type Config = {
    name?: string,
    maxItems?: number
};

type MemoryCache = {
    name: string,
    load: Operator<Payload,Payload>,
    save: Operator<Payload,Payload>,
    clear: Operator<Payload,Payload>
};

export default (config: Config = {}): MemoryCache => {

    let name: string = config.name || 'memory-cache';
    let cache: Map<string, AsyncSubject> = config.maxItems
        ? new LRUMap(config.maxItems)
        : new Map();

    let load = flatMap((payload: Payload) => {
        let cached = cache.get(payload.id);
        if(cached) {
            return cached;
        }

        cache.set(payload.id, new AsyncSubject());
        return of(payload);
    });

    let save = map((payload: Payload): Payload => {

        let cached = cache.get(payload.id);
        if(cached && !cached.hasCompleted) {
            cached.next(payload);
            cached.complete();
        }

        return payload;
    });

    let clear = map((payload: Payload): Payload => {
        cache.delete(payload.id);
        return payload;
    });

    return {
        name,
        load,
        save,
        clear
    };
};
