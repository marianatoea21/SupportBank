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
		bank.listAll();
	} else if (input.toLowerCase().startsWith('list ')) {
		bank.listAccount(input.substring(5).trim());
	} else {
		console.log('Unknown command.');
	}
}
