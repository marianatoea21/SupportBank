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
            '01/01/2014 - Jon A paid Sarah T 10.00 for Pokemon Training',
            '04/01/2014 - Sarah T paid Jon A 4.00 for Lunch',
        ]);
    });

    it('reports an unknown account', () => {
        expect(bank.listAccount('Nobody')).toEqual([
            'No account found with the name "Nobody"!',
        ]);
    });

    it('reports every invalid line and imports nothing', () => {
        const bank = new Bank();
        const errors = bank.loadFromCSV('resources/BadTransactions.csv');

        expect(errors).toHaveLength(3);
        expect(errors[0]).toContain('Line 3');
        expect(bank.listAll()).toEqual([]);
    });

    it('reports a missing file', () => {
        const bank = new Bank();
        expect(bank.loadFromCSV('resources/Nothing.csv')).toHaveLength(1);
    });
});
