import './logConfig';
import log4js from 'log4js';
import readlineSync from 'readline-sync';
import { Bank } from './Bank';
import { DATA_FILES } from './config';

const logger = log4js.getLogger('index');
logger.info('SupportBank started');

const bank = new Bank();

for (const file of DATA_FILES) {
    const errors = bank.loadFromCSV(file);
    if (errors.length > 0) {
        console.log(`"${file}" contains errors, so none of its transactions were imported:`);
        errors.forEach((error) => console.log(`  ${error}`));
        console.log('Fix these lines and try again.');
    }
}

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
