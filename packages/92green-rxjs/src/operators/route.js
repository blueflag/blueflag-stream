import {filter, share} from 'rxjs/operators';
import {merge} from 'rxjs';

export default (selector: (any) => string, routes: { [string]: (Observable) }) => (obs: Observable): Observable => {
    let  $source = obs.pipe(share());
    // split everything based on the routes.
    let $filters = Object.keys(routes).map(key => {
        return $source.pipe(
            filter((ii) => selector(ii) === key),
            routes[key]
        );
    });
    return merge(...$filters);
};
