import { Transaction} from './Transaction';

export class Account {
    public transactions: Transaction[] = [];

    constructor(public name: string) {}

    public getBalance(): number {
        return this.transactions.reduce((balance, transaction) => {
            if (transaction.to === this.name) {
                return balance + transaction.amount;
            } else if (transaction.from === this.name) {
                return balance - transaction.amount;
            }

            return balance;
        }, 0);
    }
}
