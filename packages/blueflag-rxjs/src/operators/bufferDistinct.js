//@flow
import {Observable} from 'rxjs';

type Value = any;
type Predicate = (value: Value) => any;

export default (predicate: Predicate) => (source: Observable): Observable => {
    return Observable.create(subscriber => {

        let buffer: Value[] = [];
        let first: boolean = true;
        let prevComparisonValue: any = undefined;

        return source.subscribe(
            (value: Value) => {
                let comparisonValue: any = predicate(value);
                if(!first && !Object.is(comparisonValue, prevComparisonValue)) {
                    subscriber.next(buffer);
                    buffer = [];
                }

                buffer.push(value);
                prevComparisonValue = comparisonValue;
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
