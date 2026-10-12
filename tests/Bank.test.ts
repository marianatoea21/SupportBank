import { describe, it, expect } from '@jest/globals';
import { Bank } from '../src/Bank';

describe('Bank', () => {
    const bank = new Bank();
    bank.loadFromCSV('resources/TestTransactions.csv');

    it('lists the balance of every account', () => {
        expect(bank.listAll()).toEqual([
            'Jon A owes 6.00',
            'Sarah T is owed 6.00',
        ]);
    });

    it('lists the transactions of one account', () => {
        expect(bank.listAccount('Jon A')).toEqual([
            '01/01/2014 - Pokemon Training',
            '04/01/2014 - Lunch',
        ]);
    });

    it('reports an unknown account', () => {
        expect(bank.listAccount('Nobody')).toEqual([
            'No account found with the name "Nobody"!',
        ]);
    });
});
