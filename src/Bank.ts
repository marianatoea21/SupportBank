import * as fs from 'fs';
import { parse, format } from 'date-fns';
import { Account } from './Account';
import { Transaction } from './Transaction';

export class Bank {
    private accounts: Map<string, Account> = new Map();

    loadFromCSV(filePath: string): void {
        const lines = fs.readFileSync(filePath, 'utf-8').split(/\r?\n/).slice(1);

        for (const line of lines) {
            const lineElements = line.split(',');
            if (lineElements.length < 5) {
                continue;
            }

            const [dateText, from, to, narrative, amountText] = lineElements;

            const transaction = new Transaction(
                parse(dateText, 'dd/MM/yyyy', new Date()),
                from,
                to,
                narrative,
                parseFloat(amountText)
            );

            this.getOrCreateAccount(from).transactions.push(transaction);
            this.getOrCreateAccount(to).transactions.push(transaction);      
        }
    }

    private getOrCreateAccount(name: string): Account {
        let account = this.accounts.get(name);
        if (!account) {
            account = new Account(name);
            this.accounts.set(name, account);
        }
        return account;
    }

    listAll(): void {
        for (const account of this.accounts.values()) {
            const balance = account.getBalance();
            const status = balance >= 0 ? 'is owed' : 'owes';
            console.log(`${account.name} ${status} ${Math.abs(balance).toFixed(2)}.`);
        }
    }

    listAccount(name: string): void {
        const account = this.accounts.get(name);

        if (!account) {
            console.log(`No account found with the name "${name}"!`);
            return;
        }

        for (const transaction of account.transactions) {
            const date = format(transaction.date, 'dd/MM/yyyy');
            console.log(`${date} - ${transaction.narrative}`);
        }
    }
}
