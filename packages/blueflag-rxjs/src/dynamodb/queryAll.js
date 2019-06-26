//@flow
import {Observable} from 'rxjs';
import {EMPTY} from 'rxjs';
import {expand} from 'rxjs/operators';

type QueryResult = {
    promise: () => Promise<any>
};

type Query = (params: any) => QueryResult;

type DocClient = {
    query: Query
};

type Response = {
    Items: any[],
    LastEvaluatedKey?: string
};

type FeedbackObservable = (obs: Observable) => Observable;

export default (docClient: DocClient, params: any, feedbackObservable: FeedbackObservable = obs => obs): Observable => {

    let sendQuery = (params: any): Observable => {
        return new Observable((subscriber: any) => {
            docClient
                .query(params)
                .promise()
                .then((response: Response) => subscriber.next(response));
        });
    };

    return sendQuery(params).pipe(
        expand((response: Response) => {
            let {LastEvaluatedKey} = response;
            if(LastEvaluatedKey) {
                let obs = sendQuery({
                    ...params,
                    ExclusiveStartKey: LastEvaluatedKey
                });

                return feedbackObservable(obs);
            }
            return EMPTY;
        })
    );
};
