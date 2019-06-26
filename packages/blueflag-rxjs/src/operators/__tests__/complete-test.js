// @flow
import {Subject} from 'rxjs';
import complete from '../complete';
import {COMPLETE} from '../complete';

describe('complete', () => {

    it('complete should emit one item upon complete', () => {
        let output = jest.fn();

        const subject = new Subject();

        subject
            .pipe(complete())
            .subscribe(output);

        expect(output).toHaveBeenCalledTimes(0);

        subject.complete();
        expect(output).toHaveBeenCalledTimes(1);
        expect(output.mock.calls[0][0]).toBe(COMPLETE);
    });

    it('complete should not affect parallel observables', () => {
        let output = jest.fn();

        const subject = new Subject();

        subject.subscribe(output);
        subject.pipe(complete());
        subject.next(123);

        expect(output).toHaveBeenCalledTimes(1);
        expect(output.mock.calls[0][0]).toBe(123);
    });
});
