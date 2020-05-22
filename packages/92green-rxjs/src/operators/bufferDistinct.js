//@flow
import {Observable} from 'rxjs';

type Value = any;
type Predicate = (value: Value) => any;

export default (predicate: Predicate, flushObs: ?Observable) => (source: Observable): Observable => {
    return Observable.create(subscriber => {

        let buffer: Value[] = [];
        let blank: boolean = true;
        let prevComparisonValue: any = undefined;

        let flush = () => {
            if(buffer.length > 0) {
                subscriber.next(buffer);
                buffer = [];
            }
        };

        if(flushObs) {
            flushObs.subscribe(() => {
                flush();
                blank = true;
            });
        }

        return source.subscribe(
            (value: Value) => {
                let comparisonValue: any = predicate(value);
                if(!blank && !Object.is(comparisonValue, prevComparisonValue)) {
                    flush();
                }

                buffer.push(value);
                prevComparisonValue = comparisonValue;
                blank = false;
            },
            (err) => subscriber.error(err),
            () => {
                flush();
                subscriber.complete();
            }
        );
    });
};
