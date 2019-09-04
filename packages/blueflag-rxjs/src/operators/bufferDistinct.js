//@flow
import {Observable} from 'rxjs';

type Value = any;
type Predicate = (value: Value) => any;

export default (predicate: Predicate) => (source: Observable): Observable => {
    return Observable.create(subscriber => {

        let buffer: Value[] = [];
        let first: boolean = true;
        let prevValue: Value = undefined;

        return source.subscribe(
            (value: Value) => {
                if(!first && !Object.is(predicate(value), prevValue)) {
                    subscriber.next(buffer);
                    buffer = [];
                }

                buffer.push(value);
                prevValue = value;
                first = false;
            },
            (err) => subscriber.error(err),
            () => {
                if(buffer.length > 0) {
                    subscriber.next(buffer);
                }
                subscriber.complete();
            }
        );
    });
};
