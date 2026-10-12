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
}
