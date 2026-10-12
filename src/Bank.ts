import * as fs from 'fs';
import log4js from 'log4js';
import { parse, format , isValid } from 'date-fns';
import { Account } from './Account';
import { Transaction } from './Transaction';
import { BalanceStatus } from './BalanceStatus';

const logger = log4js.getLogger('Bank');

export class Bank {
    private accounts: Map<string, Account> = new Map();

    loadFromCSV(filePath: string): string[] {
        logger.info(`Loading transactions from ${filePath}`);

        let content: string;
        try {
            content = fs.readFileSync(filePath, 'utf-8');
        } catch (error) {
            logger.error(`Could not read file ${filePath}: ${error}`);
            return [`Could not read the file "${filePath}".`];
        }

        const transactions: Transaction[] = [];
        const errors: string[] = [];

        const addError = (lineNumber: number, reason: string, line: string) => {
            logger.error(`${filePath}, line ${lineNumber}: ${reason}. Line content: "${line}"`);
            errors.push(`Line ${lineNumber}: ${reason}`);
        };

        content.split(/\r?\n/).forEach((line, index) => {
            if (index === 0 || line.trim() === '') {
                return; 
            }

            const lineNumber = index + 1; 
            logger.debug(`Reading line ${lineNumber}: ${line}`);

            const parts = line.split(',');
            if (parts.length !== 5) {
                addError(lineNumber, `expected 5 values but found ${parts.length}`, line);
                return;
            }

            const [dateText, from, to, narrative, amountText] = parts;

            const date = parse(dateText, 'dd/MM/yyyy', new Date());
            if (!isValid(date)) {
                addError(lineNumber, `"${dateText}" is not a valid date (expected dd/MM/yyyy)`, line);
                return;
            }

            const amount = Number(amountText);
            if (amountText.trim() === '' || Number.isNaN(amount)) {
                addError(lineNumber, `"${amountText}" is not a valid amount`, line);
                return;
            }

            transactions.push(new Transaction(date, from, to, narrative, amount));
        });

        if (errors.length > 0) {
            logger.warn(`Import of ${filePath} aborted: ${errors.length} invalid line(s)`);
            return errors;
        }

        for (const transaction of transactions) {
            this.getOrCreateAccount(transaction.from).transactions.push(transaction);
            this.getOrCreateAccount(transaction.to).transactions.push(transaction);
        }
        
        logger.info(`Loaded ${transactions.length} transactions from ${filePath}`);
        return [];
    }

    private getOrCreateAccount(name: string): Account {
        let account = this.accounts.get(name);
        if (!account) {
            account = new Account(name);
            this.accounts.set(name, account);
        }
        return account;
    }

    listAll(): string[] {
        const lines: string[] = [];
        
        for (const account of this.accounts.values()) {
            const balance = account.getBalance();
            const status = balance >= 0 ? BalanceStatus.IsOwed : BalanceStatus.Owes;
            lines.push(`${account.name} ${status} ${Math.abs(balance).toFixed(2)}`);
        }
        return lines;
    }

    listAccount(name: string): string[] {
        const account = this.accounts.get(name);

        if (!account) {
            return [`No account found with the name "${name}"!`];
        }

        const lines: string[] = [];
        
        for (const transaction of account.transactions) {
            lines.push(transaction.toString());
        }
        return lines;
    }
}
