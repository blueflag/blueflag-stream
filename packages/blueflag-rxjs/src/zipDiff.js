//@flow
import type {Observable} from 'rxjs';

import {from} from 'rxjs';
import {merge} from 'rxjs';
import {pipe} from 'rxjs';
import {filter} from 'rxjs/operators';
import {flatMap} from 'rxjs/operators';
import {map} from 'rxjs/operators';
import {share} from 'rxjs/operators';
import {tap} from 'rxjs/operators';

import complete from './operators/complete';

type Keyer = (item: any) => any;

type TaggedItem = {
    item: any,
    source: "a"|"b",
    key: any
};

type SourceKeyedItem = {
    a?: any,
    b?: any
};

export default (obsA: Observable, obsB: Observable, keyBy: Keyer, keyByB: ?Keyer): Observable => {

    //
    // configuration
    //

    let keyBys = {
        a: keyBy,
        b: keyByB || keyBy
    };

    //
    // buffer (stateful)
    //

    // buffer contains TaggedItem's keyed by their keys
    // once an item leaves the buffer, the key remains
    // and the value is set to undefined
    let buffer: Map<any, ?TaggedItem> = new Map();

    let bufferAsObservable = (): TaggedItem[] => {
        let arr = [];
        for(let value of buffer.values()) {
            if(value) {
                arr.push(value);
            }
        }
        return from(arr);
    };

    let skipBuffer = {
        a: false,
        b: false
    };

    // this will add items to buffer, and remove matching items
    // if items match, true is returned

    let pipeThroughBuffer = () => map((item: TaggedItem): ?SourceKeyedItem => {
        let {key, source} = item;
        let bufferItem: ?TaggedItem = buffer.get(key);

        // if key exists in buffer with an undefined value
        // then this key has already been and gone through the buffer
        // so throw this new item away
        if(!bufferItem && buffer.has(key)) {
            return;
        }

        if(bufferItem && item.source !== bufferItem.source) {
            // log(`matched ${source}'s ${key} with item in buffer`);
            buffer.set(key, undefined);
            return {
                ...taggedItemToSourceKeyedItem(item),
                ...taggedItemToSourceKeyedItem(bufferItem)
            };
        }

        if(skipBuffer[source]) {
            // log(`${source}'s ${key} skips buffer`);
            return taggedItemToSourceKeyedItem(item);
        }

        // log(`adding ${source}'s ${key} to buffer`);
        buffer.set(key, item);
    });

    //
    // type conversion
    //

    let itemToTaggedItem = (source: "a"|"b") => (item: any): TaggedItem => ({
        item,
        source,
        key: keyBys[source](item)
    });

    let taggedItemToSourceKeyedItem = (taggedItem: TaggedItem): SourceKeyedItem => ({
        [taggedItem.source]: taggedItem.item
    });

    //
    // operators
    //

    let sendBufferedItemsOnComplete = (source: "a"|"b") => pipe(
        complete(),
        tap(() => {
            // log(`${source} has completed`);
            skipBuffer[source] = true;
        }),
        flatMap(() => bufferAsObservable()),
        filter((item: TaggedItem): boolean => item.source === source),
        tap((item: TaggedItem) => {
            buffer.set(item.key, undefined);
        }),
        map(taggedItemToSourceKeyedItem)
    );

    //
    // observable creation
    //

    // tag items so we know if they came from observable A and B,
    // and precompute their keys

    let obsTaggedA: Observable = obsA.pipe(
        map(itemToTaggedItem('a')),
        pipeThroughBuffer(),
        share()
    );

    let obsTaggedB: Observable = obsB.pipe(
        map(itemToTaggedItem('b')),
        pipeThroughBuffer(),
        share()
    );

    // on close A, release all B items in buffer and vice versa because they'll never match anything
    let obsFlushA: Observable = obsTaggedB.pipe(
        sendBufferedItemsOnComplete('a')
    );

    let obsFlushB: Observable = obsTaggedA.pipe(
        sendBufferedItemsOnComplete('b')
    );

    let obsNonBuffered: Observable = merge(obsTaggedA, obsTaggedB).pipe(
        filter(Boolean)
    );

    return merge(obsFlushA, obsFlushB, obsNonBuffered);
};
