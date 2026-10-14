import { Transaction } from './Transaction';

export class Account {
    name: string = '';
    transactions: Transaction[] = [];

    constructor(name: string) {
        this.name = name;
    } 

    public getBalance(): number {
        let balance = 0;

        for (const transaction of this.transactions) {
            if (transaction.from === this.name) {
                balance -= transaction.amount;
            } 
            if (transaction.to === this.name) {
                balance += transaction.amount;
            }
        }
        return balance;
    }
}
