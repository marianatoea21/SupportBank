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

    it('imports a CSV file through importFile', () => {
        const csvBank = new Bank();

        expect(csvBank.importFile('resources/TestTransactions.csv')).toEqual([]);
        expect(csvBank.listAll()).toHaveLength(2);
    });

    it('imports a JSON file', () => {
        const jsonBank = new Bank();

        expect(jsonBank.importFile('resources/TestTransactions.json')).toEqual([]);
        expect(jsonBank.listAll()).toEqual([
            'Jon A owes 6.00',
            'Sarah T is owed 6.00',
        ]);
    });

    it('reports every invalid JSON record and imports nothing', () => {
        const jsonBank = new Bank();
        const errors = jsonBank.importFile('resources/BadTransactions.json');

        expect(errors).toHaveLength(2);
        expect(errors[0]).toContain('Record 1');
        expect(jsonBank.listAll()).toEqual([]);
    });

    it('reports a file that is not valid JSON', () => {
        expect(new Bank().importFile('resources/NotJson.json')).toHaveLength(1);
    });

    it('reports JSON that is not a list', () => {
        expect(new Bank().importFile('resources/NotAList.json')).toHaveLength(1);
    });

    it('reports records that are not objects or have missing names', () => {
        const errors = new Bank().importFile('resources/BadRecords.json');

        expect(errors).toEqual([
            'Record 1: expected an object',
            'Record 2: the FromAccount or ToAccount name is missing',
        ]);
    });

    it('rejects an unsupported file type', () => {
        expect(new Bank().importFile('resources/badFile.json')).toHaveLength(1);
    });

    it('rejects an unsupported file type', () => {
        const errors = new Bank().importFile('resources/notes.txt');

        expect(errors).toHaveLength(1);
        expect(errors[0]).toContain('Unsupported file extension');
    });
});
