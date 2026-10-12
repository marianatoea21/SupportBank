import * as fs from 'fs';
import log4js from 'log4js';
import { parse, isValid } from 'date-fns';
import { Account } from './Account';
import { Transaction } from './Transaction';
import { BalanceStatus } from './BalanceStatus';

const logger = log4js.getLogger('Bank');

export class Bank {
    private accounts: Map<string, Account> = new Map();

    loadFromCSV(filePath: string): string[] {
        logger.info(`Loading transactions from ${filePath}`);

        let fileContent: string;
        try {
            fileContent = fs.readFileSync(filePath, 'utf-8');
        } catch (error) {
            logger.error(`Could not read file ${filePath}: ${error}`);
            return [`Could not read the file "${filePath}".`];
        }

        const lines = fileContent.split(/\r?\n/).slice(1);
        const transactions: Transaction[] = [];
        const errors: string[] = [];

        let lineNumber = 1;

        for (const line of lines) {
            lineNumber++;

            if (line.trim() === '') {
                continue;
            }

            logger.debug(`Reading line ${lineNumber}: ${line}`);

            const lineElements = line.split(',');
            if (lineElements.length !== 5) {
                this.addError(errors, filePath, lineNumber, `expected 5 values but found ${lineElements.length}`, line);
                continue;
            }

            const [dateText, from, to, narrative, amountText] = lineElements;

            const date = parse(dateText, 'dd/MM/yyyy', new Date());
            if (!isValid(date)) {
                this.addError(errors, filePath, lineNumber, `"${dateText}" is not a valid date (expected dd/MM/yyyy)`, line);
                continue;
            }

            const amount = Number(amountText);
            if (amountText.trim() === '' || Number.isNaN(amount)) {
                this.addError(errors, filePath, lineNumber, `"${amountText}" is not a valid amount`, line);
                continue;
            }

            transactions.push(new Transaction(date, from, to, narrative, amount));
        }

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

    private addError(errors: string[], filePath: string, lineNumber: number, reason: string, line: string): void {
        logger.error(`${filePath}, line ${lineNumber}: ${reason}. Line content: "${line}"`);
        errors.push(`Line ${lineNumber}: ${reason}`);
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
