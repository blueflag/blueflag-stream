// @flow
import queryAll from '../queryAll';
import {tap} from 'rxjs/operators';

describe('queryAll', () => {

    it('queryAll should pass params and make request', async () => {

        expect.assertions(3);

        let params = {
            TableName: 'fake-table'
        };

        let responsePayload = {
            Items: [100, 200, 300],
            Count: 3
        };

        let docClient = {
            query: jest.fn()
                .mockImplementation(() => ({
                    promise: () => Promise.resolve(responsePayload)
                }))
        };

        let obs = queryAll(docClient, params);

        obs.subscribe(response => {
            expect(response).toEqual(responsePayload);
            expect(docClient.query).toHaveBeenCalledTimes(1);
            expect(docClient.query.mock.calls[0][0]).toEqual(params);
        });
    });

    it('queryAll should re-request with ExclusiveStartKey if LastEvaluatedKey is present on response', async () => {

        expect.assertions(6);

        let params = {
            TableName: 'fake-table'
        };

        let responsePayloads = [
            {
                Items: [100, 200, 300],
                LastEvaluatedKey: 'foo'
            },
            {
                Items: [400, 500, 600],
                LastEvaluatedKey: 'bar'
            },
            {
                Items: [700, 800, 900]
            }
        ];

        let expectedParams = [
            {
                TableName: 'fake-table'
            },
            {
                TableName: 'fake-table',
                ExclusiveStartKey: 'foo'
            },
            {
                TableName: 'fake-table',
                ExclusiveStartKey: 'bar'
            }
        ];

        let docClient = {
            query: jest.fn()
                .mockImplementationOnce(() => ({
                    promise: () => Promise.resolve(responsePayloads[0])
                }))
                .mockImplementationOnce(() => ({
                    promise: () => Promise.resolve(responsePayloads[1])
                }))
                .mockImplementationOnce(() => ({
                    promise: () => Promise.resolve(responsePayloads[2])
                }))
        };

        let obs = queryAll(docClient, params);

        let i = 0;
        obs.subscribe(response => {
            expect(response).toEqual(responsePayloads[i]);
            expect(docClient.query.mock.calls[i][0]).toEqual(expectedParams[i]);
            i++;
        });
    });

    it('queryAll should accept feedback observable that gets used in each feedback loop', async () => {

        expect.assertions(6);

        let params = {
            TableName: 'fake-table'
        };

        let responsePayloads = [
            {
                Items: [100, 200, 300],
                LastEvaluatedKey: 'foo'
            },
            {
                Items: [400, 500, 600],
                LastEvaluatedKey: 'bar'
            },
            {
                Items: [700, 800, 900]
            }
        ];

        let docClient = {
            query: jest.fn()
                .mockImplementationOnce(() => ({
                    promise: () => Promise.resolve(responsePayloads[0])
                }))
                .mockImplementationOnce(() => ({
                    promise: () => Promise.resolve(responsePayloads[1])
                }))
                .mockImplementationOnce(() => ({
                    promise: () => Promise.resolve(responsePayloads[2])
                }))
        };

        let tapFunction = jest.fn();
        let feedbackObservable = (obs) => obs.pipe(tap(tapFunction));

        let obs = queryAll(docClient, params, feedbackObservable);

        let i = 0;
        obs.subscribe(response => {
            expect(response).toEqual(responsePayloads[i]);
            expect(tapFunction.mock.calls.length).toBe(i);
            i++;
        });
    });

});
