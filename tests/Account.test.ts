import { describe, it, expect } from '@jest/globals';
import { Account } from '../src/Account';
import { Transaction } from '../src/Transaction';

describe('Account', () => {
    it('has a balance of 0 when it has no transactions', () => {
        const account = new Account('Jon A');
        
        expect(account.getBalance()).toBe(0);
    });

    it('adds money received', () => {
        const account = new Account('Jon A');
        account.transactions.push(
            new Transaction(new Date(2014, 0, 1), 'Sarah T', 'Jon A', 'Lunch', 10)
        );

        expect(account.getBalance()).toBe(10);
    });

    it('subtracts money paid', () => {
        const account = new Account('Jon A');
        account.transactions.push(
            new Transaction(new Date(2014, 0, 1), 'Jon A', 'Sarah T', 'Lunch', 10)
        );

        expect(account.getBalance()).toBe(-10);
    });

    it('combines money received and paid', () => {
        const account = new Account('Jon A');
        account.transactions.push(
            new Transaction(new Date(2014, 0, 1), 'Sarah T', 'Jon A', 'Coffee', 10),
            new Transaction(new Date(2014, 0, 2), 'Jon A', 'Tim L', 'Beers', 4)
        );

        expect(account.getBalance()).toBeCloseTo(6);
    });
});
