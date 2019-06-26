// @flow
import {Subject} from 'rxjs';
import zipDiff from '../zipDiff';

describe('zipDiff', () => {

    it('zipDiff should emit items when they match', () => {
        let output = jest.fn();

        const subjectA = new Subject();
        const subjectB = new Subject();
        zipDiff(subjectA, subjectB, item => item.id).subscribe(output);

        expect(output).toHaveBeenCalledTimes(0);

        // add an item to A with an id that only A will have
        subjectA.next({
            id: '100',
            name: 'Angry'
        });

        // expect no output yet...
        expect(output).toHaveBeenCalledTimes(0);

        // add an item to B
        subjectB.next({
            id: '200',
            name: 'Bangry'
        });

        // still expect no output output yet...
        expect(output).toHaveBeenCalledTimes(0);

        // add an item to B with an id that matches a prevous one
        subjectA.next({
            id: '200',
            name: 'Other bangry'
        });

        // id of 'b' should match previous and emit an item
        expect(output).toHaveBeenCalledTimes(1);
        expect(output.mock.calls[0][0]).toEqual({
            a: {
                id: '200',
                name: 'Other bangry'
            },
            b: {
                id: '200',
                name: 'Bangry'
            }
        });
    });

    it('zipDiff should emit items that dont have matches once an input observable is finished', () => {
        let output = jest.fn();

        const subjectA = new Subject();
        const subjectB = new Subject();

        zipDiff(subjectA, subjectB, item => item.id).subscribe(output);

        subjectA.next({
            id: '100',
            name: 'Cool'
        });

        subjectA.next({
            id: '200',
            name: 'Fool'
        });

        subjectB.next({
            id: '300',
            name: 'Wool'
        });

        subjectB.next({
            id: '400',
            name: 'Tool'
        });

        // expect no output output yet...
        expect(output).toHaveBeenCalledTimes(0);

        subjectA.complete();

        // expect all B items to emit now A as closed,
        // as they'll never receive a match
        expect(output).toHaveBeenCalledTimes(2);
        expect(output.mock.calls[0][0]).toEqual({
            b: {
                id: '300',
                name: 'Wool'
            }
        });
        expect(output.mock.calls[1][0]).toEqual({
            b: {
                id: '400',
                name: 'Tool'
            }
        });

        subjectB.complete();

        // expect remaining items to be emitted
        expect(output).toHaveBeenCalledTimes(4);
        expect(output.mock.calls[2][0]).toEqual({
            a: {
                id: '100',
                name: 'Cool'
            }
        });
        expect(output.mock.calls[3][0]).toEqual({
            a: {
                id: '200',
                name: 'Fool'
            }
        });
    });

    it('zipDiff should accept different keyBy functions for A and B', () => {
        let output = jest.fn();

        const subjectA = new Subject();
        const subjectB = new Subject();

        zipDiff(subjectA, subjectB, item => item.id, number => number).subscribe(output);

        subjectA.next({
            id: 100,
            name: 'Thor the Almighty'
        });

        subjectB.next(100);

        expect(output).toHaveBeenCalledTimes(1);
        expect(output.mock.calls[0][0]).toEqual({
            a: {
                id: 100,
                name: 'Thor the Almighty'
            },
            b: 100
        });
    });

    it('zipDiff should dedupe items with the same key', () => {
        let output = jest.fn();

        const subjectA = new Subject();
        const subjectB = new Subject();

        zipDiff(subjectA, subjectB, item => item.id).subscribe(output);

        subjectA.next({
            id: '100',
            name: 'Thor the Almighty'
        });

        subjectA.next({
            id: '100',
            name: 'Thor the Almighty'
        });

        expect(output).toHaveBeenCalledTimes(0);

        subjectA.complete();
        subjectB.complete();

        // zipDiff should dedupe items with the same key
        expect(output).toHaveBeenCalledTimes(1);
        expect(output.mock.calls[0][0]).toEqual({
            a: {
                id: '100',
                name: 'Thor the Almighty'
            }
        });
    });

});
