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
        share(),
        filter((item: TaggedItem): boolean => {
            let {key} = item;

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
            // $FlowFixMe - this will exist due to previous filter()
            let bufferItem: TaggedItem = buffer.get(item.key);

            return {
                ...taggedItemToSourceKeyedItem(item),
                ...taggedItemToSourceKeyedItem(bufferItem)
            };
        })
    );

    let sendBufferedItemsOnComplete = (source: "a"|"b") => pipe(
        share(),
        complete(),
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
    let obsTaggedA: Observable = obsA.pipe(map(itemToTaggedItem('a')));
    let obsTaggedB: Observable = obsB.pipe(map(itemToTaggedItem('b')));

    // merge input observables, and use the buffer
    // emitting only items that appear in both A and B
    let obsBoth: Observable = merge(obsTaggedA, obsTaggedB).pipe(bufferAndFilterMatching());

    // on close A, release all B items in buffer and vice versa
    let obsOnlyA: Observable = obsTaggedB.pipe(sendBufferedItemsOnComplete('a'));
    let obsOnlyB: Observable = obsTaggedA.pipe(sendBufferedItemsOnComplete('b'));

    return merge(obsOnlyA, obsOnlyB, obsBoth);
};
