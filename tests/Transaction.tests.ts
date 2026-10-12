import { describe, it, expect } from '@jest/globals';
import { Transaction } from '../src/Transaction';

describe('Transaction', () => {
    it('describes itself in a readable way', () => {
        const transaction = new Transaction(new Date(2014, 0, 1), 'Jon A', 'Sarah T', 'Lunch', 7.8);

        expect(transaction.toString()).toBe('01/01/2014 - Jon A paid Sarah T 7.80 for Lunch');
    });
});
