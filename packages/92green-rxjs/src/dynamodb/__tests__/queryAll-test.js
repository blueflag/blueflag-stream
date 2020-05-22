// @flow
import queryAll from '../queryAll';
import {tap} from 'rxjs/operators';

describe('queryAll', () => {

    it('queryAll should pass params and make request', async () => {


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

        let tapFn = jest.fn();

        await queryAll(docClient, params)
            .pipe(tap(tapFn))
            .toPromise();

        expect(tapFn).toHaveBeenCalledTimes(3);
        expect(tapFn.mock.calls[0][0]).toBe(100);
        expect(tapFn.mock.calls[1][0]).toBe(200);
        expect(tapFn.mock.calls[2][0]).toBe(300);

        expect(docClient.query).toHaveBeenCalledTimes(1);
        expect(docClient.query.mock.calls[0][0]).toEqual(params);
    });

    it('queryAll should re-request with ExclusiveStartKey if LastEvaluatedKey is present on response', async () => {

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

        let tapFn = jest.fn();

        await queryAll(docClient, params)
            .pipe(tap(tapFn))
            .toPromise();

        expect(tapFn).toHaveBeenCalledTimes(9);
        expect(tapFn.mock.calls[0][0]).toBe(100);
        expect(tapFn.mock.calls[1][0]).toBe(200);
        expect(tapFn.mock.calls[2][0]).toBe(300);
        expect(tapFn.mock.calls[3][0]).toBe(400);
        expect(tapFn.mock.calls[4][0]).toBe(500);
        expect(tapFn.mock.calls[5][0]).toBe(600);
        expect(tapFn.mock.calls[6][0]).toBe(700);
        expect(tapFn.mock.calls[7][0]).toBe(800);
        expect(tapFn.mock.calls[8][0]).toBe(900);

        expect(docClient.query).toHaveBeenCalledTimes(3);
        expect(docClient.query.mock.calls[0][0]).toEqual(expectedParams[0]);
        expect(docClient.query.mock.calls[1][0]).toEqual(expectedParams[1]);
        expect(docClient.query.mock.calls[2][0]).toEqual(expectedParams[2]);
    });

    it('queryAll should accept feedback pipe that gets used in each feedback loop', async () => {

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

        let tapFn = jest.fn();
        let feedbackPipeFn = jest.fn(obs => obs);

        await queryAll(docClient, params, feedbackPipeFn)
            .pipe(tap(tapFn))
            .toPromise();

        expect(tapFn).toHaveBeenCalledTimes(9);
        expect(docClient.query).toHaveBeenCalledTimes(3);
        expect(feedbackPipeFn).toHaveBeenCalledTimes(2);

    });

    it('queryAll should handle errors', async () => {
        expect.assertions(1);

        let params = {
            TableName: 'fake-table'
        };

        let docClient = {
            query: jest.fn()
                .mockImplementation(() => ({
                    promise: () => Promise.reject('!!!')
                }))
        };

        await queryAll(docClient, params)
            .toPromise()
            .catch(e => {
                expect(e).toBe('!!!');
            });
    });

});
