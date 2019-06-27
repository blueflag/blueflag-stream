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

    let buffer: Map<any, TaggedItem> = new Map();

    let bufferAsObservable = (): TaggedItem[] => {
        let arr = [];
        for(let value of buffer.values()) {
            arr.push(value);
        }
        return from(arr);
    };

    let skipBuffer = {
        a: false,
        b: false
    };

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

    let bufferAndFilterMatching = () => pipe(
        filter((item: TaggedItem): boolean => {
            let {key, source} = item;

            if(skipBuffer[source]) {
                return true;
            }

            let bufferItem: ?TaggedItem = buffer.get(key);
            let alreadyHasKey = bufferItem
                && item.source !== bufferItem.source;

            if(!alreadyHasKey) {
                buffer.set(key, item);
                return false;
            }
            return true;
        }),
        map((item: TaggedItem): SourceKeyedItem => {

            let sourceKeyedItem: SourceKeyedItem = taggedItemToSourceKeyedItem(item);

            let bufferItem: ?TaggedItem = buffer.get(item.key);
            if(bufferItem) {
                sourceKeyedItem = {
                    ...sourceKeyedItem,
                    ...taggedItemToSourceKeyedItem(bufferItem)
                };
                buffer.delete(item.key);
            }
            return sourceKeyedItem;
        })
    );

    let sendBufferedItemsOnComplete = (source: "a"|"b") => pipe(
        complete(),
        tap(() => {
            skipBuffer[source] = true;
        }),
        flatMap(() => bufferAsObservable()),
        filter((item: TaggedItem): boolean => item.source === source),
        tap((item: TaggedItem) => {
            buffer.delete(item.key);
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
        share()
    );

    let obsTaggedB: Observable = obsB.pipe(
        map(itemToTaggedItem('b')),
        share()
    );

    // merge input observables, and use the buffer
    // emitting only items that appear in both A and B
    let obsBoth: Observable = merge(obsTaggedA, obsTaggedB).pipe(bufferAndFilterMatching());

    // on close A, release all B items in buffer and vice versa because they'll never match anything
    let obsOnlyA: Observable = obsTaggedB.pipe(sendBufferedItemsOnComplete('a'));
    let obsOnlyB: Observable = obsTaggedA.pipe(sendBufferedItemsOnComplete('b'));

    return merge(obsOnlyA, obsOnlyB, obsBoth);
};
