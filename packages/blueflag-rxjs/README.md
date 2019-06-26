# blueflag-rxjs

Rxjs algorithms.

## zipDiff

Takes two observables and finds which items exist in one or both, according to a key.
It emits items with matching items zipped together on an object: `{a: itemA, b: itemB}`,
and emits unmatched items on objects with single keys like `{a: itemA}`, `{b: itemB}`.

The `keyBy` function is called on each item. The data returned is used as an identifier to
work out when two items are matching.

A second `keyBy` function can be added if you need a different keyBy function for the second observable.

```js
zipDiff(
    obsA: Observable,
    obsB: Observable,
    keyBy: (item) => any,
    keyByB?: (item) => any
)
```

```js
zipDiff(obsA, obsB, itemA => itemA.id)

// obsA adds {id: "1", name: "One"}
// obsA adds {id: "2", name: "Two"}
// obsB adds {id: "2", name: "Three"}
// obsB adds {id: "2", name: "Too"}

// output:

{
    a: {id: "2", name: "Two"},
    b: {id: "2", name: "Too"}
}

{
    a: {id: "1", name: "One"}
}

{
    b: {id: "2", name: "Two"}
}

```

## operators/complete

Emits a single item upon completion of the observable.

```js
complete()
```

```js
obs.pipe(
    complete(),
    tap(() => {
        console.log("I'm done mate");
    })
);
```
