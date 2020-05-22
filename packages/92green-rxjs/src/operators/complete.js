//@flow
import type {Observable} from 'rxjs';

import {concat} from 'rxjs';
import {of} from 'rxjs';
import {filter} from 'rxjs/operators';

export const COMPLETE = Symbol('COMPLETE');

export default () => (obs: Observable): Observable => {
    return concat(obs, of(COMPLETE)).pipe(
        filter(item => item === COMPLETE)
    );
};
