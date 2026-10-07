export class Transaction {
    constructor(
        public date: Date, 
        public from: string,
        public to: string,
        public narrative: string,
        public amount: number
    ) {}
}
