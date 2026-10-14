import * as fs from 'fs';
import * as path from 'path';
import log4js from 'log4js';
import { parse, parseISO, isValid, addDays } from 'date-fns';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { Account } from './Account';
import { Transaction } from './Transaction';
import { BalanceStatus } from './BalanceStatus';

const logger = log4js.getLogger('Bank');
const EXCEL_EPOCH = new Date(1899, 11, 30);

export class Bank {
    private accounts: Map<string, Account> = new Map();

    loadFromCSV(filePath: string): string[] {
        logger.info(`Loading transactions from ${filePath}`);

        const fileContent = this.readFile(filePath);
        if (fileContent === undefined) {
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

        return this.finishImport(filePath, transactions, errors);
    }

    loadFromJSON(filePath: string): string[] {
        logger.info(`Loading transactions from ${filePath}`);

        const fileContent = this.readFile(filePath);
        if (fileContent === undefined) {
            return [`Could not read the file "${filePath}".`];
        }

        let records: any;
        try {
            records = JSON.parse(fileContent);
        } catch (error) {
            logger.error(`${filePath} is not valid JSON: ${error}`);
            return [`The file "${filePath}" is not valid JSON.`];
        }

        if (!Array.isArray(records)) {
            logger.error(`${filePath} does not contain a list of transactions`);
            return [`The file "${filePath}" should contain a list of transactions.`];
        }

        const transactions: Transaction[] = [];
        const errors: string[] = [];

        let recordNumber = 0;

        for (const record of records) {
            recordNumber++;

            if (typeof record !== 'object' || record === null) {
                errors.push(`Record ${recordNumber}: expected an object`);
                continue;
            }

            const date = parseISO(String(record.Date));
            if (!isValid(date)) {
                errors.push(`Record ${recordNumber}: "${record.Date}" is not a valid date`);
                continue;
            }

            if (typeof record.FromAccount !== 'string' || typeof record.ToAccount !== 'string') {
                errors.push(`Record ${recordNumber}: the FromAccount or ToAccount name is missing`);
                continue;
            }

            if (typeof record.Amount !== 'number') {
                errors.push(`Record ${recordNumber}: "${record.Amount}" is not a valid amount`);
                continue;
            }

            transactions.push(
                new Transaction(date, record.FromAccount, record.ToAccount, String(record.Narrative), record.Amount)
            );
        }

        return this.finishImport(filePath, transactions, errors);
    }

    loadFromXML(filePath: string): string[] {
        logger.info(`Loading transactions from ${filePath}`);

        const fileContent = this.readFile(filePath);
        if (fileContent === undefined) {
            return [`Could not read the file "${filePath}".`];
        }

        const validation = XMLValidator.validate(fileContent);
        if (validation !== true) {
            logger.error(`${filePath} is not valid XML: ${validation.err.msg}`);
            return [`The file "${filePath}" is not valid XML (line ${validation.err.line}): ${validation.err.msg}`];
        }

        const xmlParser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '@_',
            parseTagValue: false,
            parseAttributeValue: false,
        });

        const data = xmlParser.parse(fileContent);
        const found = data.TransactionList?.SupportTransaction;
        if (found === undefined) {
            logger.error(`${filePath} contains no SupportTransaction elements`);
            return [`The file "${filePath}" contains no transactions.`];
        }

        const items = Array.isArray(found) ? found : [found];

        const transactions: Transaction[] = [];
        const errors: string[] = [];

        let transactionNumber = 0;

        for (const item of items) {
            transactionNumber++;

            const date = addDays(EXCEL_EPOCH, Number(item['@_Date']));
            if (!isValid(date)) {
                errors.push(`Transaction ${transactionNumber}: "${item['@_Date']}" is not a valid date`);
                continue;
            }

            const from = String(item.Parties?.From ?? '');
            const to = String(item.Parties?.To ?? '');
            if (from.trim() === '' || to.trim() === '') {
                errors.push(`Transaction ${transactionNumber}: the From or To name is missing`);
                continue;
            }

            const amountText = String(item.Value ?? '');
            const amount = Number(amountText);
            if (amountText.trim() === '' || Number.isNaN(amount)) {
                errors.push(`Transaction ${transactionNumber}: "${amountText}" is not a valid amount`);
                continue;
            }

            const narrative = String(item.Description ?? '');

            transactions.push(new Transaction(date, from, to, narrative, amount));
        }

        return this.finishImport(filePath, transactions, errors);
    }

    private addError(errors: string[], filePath: string, lineNumber: number, reason: string, line: string): void {
        logger.error(`${filePath}, line ${lineNumber}: ${reason}. Line content: "${line}"`);
        errors.push(`Line ${lineNumber}: ${reason}`);
    }

    private addTransactions(transactions: Transaction[]): void {
        for (const transaction of transactions) {
            const fromAccount = this.getOrCreateAccount(transaction.from);
            const toAccount = this.getOrCreateAccount(transaction.to);

            fromAccount.transactions.push(transaction);
            if (toAccount !== fromAccount) {
                toAccount.transactions.push(transaction);
            }
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

    private readFile(filePath: string): string | undefined {
        try {
            return fs.readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, '');
        } catch (error) {
            logger.error(`Could not read file ${filePath}: ${error}`);
            return undefined;
        }
    }

    private finishImport(filePath: string, transactions: Transaction[], errors: string[]): string[] {
        if (errors.length > 0) {
            logger.warn(`Import of ${filePath} aborted: ${errors.length} invalid entr${errors.length === 1 ? 'y' : 'ies'}`);
            return errors;
        }

        this.addTransactions(transactions);
        logger.info(`Loaded ${transactions.length} transactions from ${filePath}`);
        return [];
    }

    importFile(filePath: string): string[] {
        const extension = path.extname(filePath).toLowerCase();

        if (extension === '.csv') {
            return this.loadFromCSV(filePath);
        }
        if (extension === '.json') {
            return this.loadFromJSON(filePath);
        }
        if (extension === '.xml') {
            return this.loadFromXML(filePath);
        }

        logger.error(`Unsupported file extension "${extension}" for file ${filePath}`);
        return [`Unsupported file extension "${extension}". Only .csv, .json and .xml are supported.`];
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
