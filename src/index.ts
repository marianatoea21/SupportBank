import readlineSync from 'readline-sync';
import { Bank } from './Bank';

const bank = new Bank();
bank.loadFromCSV('resources/Transactions2014.csv');

console.log('Commands: "List All", "List [Account Name]", "exit"');

while (true) {
	const input = readlineSync.question('> ').trim();

	if (input.toLowerCase() === 'exit') {
		break;
	}

	if (input.toLowerCase() === 'list all') {
		for (const line of bank.listAll()) {
        	console.log(line);
    	}
	} else if (input.toLowerCase().startsWith('list ')) {
		for (const line of bank.listAccount(input.substring(5).trim())) {
            console.log(line);
        }
	} else {
		console.log('Unknown command.');
	}
}
