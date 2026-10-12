import { format } from 'date-fns';

export class Transaction {
    date: Date;
    from: string;
    to: string;
    narrative: string;
    amount: number;

    constructor(
        date: Date, 
        from: string,
        to: string,
        narrative: string,
        amount: number
    ) {
        this.date = date;
        this.from = from;
        this.to = to;
        this.narrative = narrative;
        this.amount = amount;
    }

    toString(): string {
        const date = format(this.date, 'dd/MM/yyyy');
        return `${date} - ${this.from} paid ${this.to} ${this.amount.toFixed(2)} for ${this.narrative}`;
    }
}
