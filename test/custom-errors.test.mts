
import { describe, expect, it } from "vitest";
import { FileConflictError, MissingInJSONError, APIFetchError } from '../source/custom-errors.mjs';

describe('Custom Errors', () => {
    describe('FileConflictError', () => {
        it('should correctly set the message and conflicts', () => {
            const conflicts = ['file1', 'file2'];
            const error = new FileConflictError('Conflict error message', { conflicts });

            expect(error.message).toBe('Conflict error message');
            expect(error.conflicts).toEqual(conflicts);
            expect(error.name).toBe('FileConflictError');
        });
    });

    describe('MissingInJSONError', () => {
        it('should correctly set the message', () => {
            const error = new MissingInJSONError('Missing data error message');

            expect(error.message).toBe('Missing data error message');
            expect(error.name).toBe('MissingInJSONError');
        });
    });

    describe('APIFetchError', () => {
        it('should correctly set the message', () => {
            const error = new APIFetchError('API fetch error message');

            expect(error.message).toBe('API fetch error message');
            expect(error.name).toBe('APIFetchError');
        });
    });
});

