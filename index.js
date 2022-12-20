const chalk = require('chalk');
const {program} = require('commander');
const Table = require('cli-table');

// 房價(元)
const BUY_PRICE = 1000 * 10000;
// 頭款佔比(%)
const INITIAL_AMOUNT_RATE = 20;
// 貸款期數(月)
const LOAN_MONTHS = 360;
// 房貸年利率(%)
const LOAN_RATE = 1.9;
// 每年房租收入(元)
const YEARLY_RENT = 30 * 10000;
// 房屋持有時間(月)
const OWN_MONTHS = 240;
// 房屋出售價格(元)
const SELL_PRICE = 1200 * 10000;

program
	.name(' ')
	.usage(
		`
  計算不動產投資報酬率.
    node . cal`);

program
	.command('cal')
	.description('計算不動產投資報酬率');

function calculateROI() {
	// 貸款金額
	const loanAmount = BUY_PRICE * (1 - (INITIAL_AMOUNT_RATE * 0.01));
	const averagePrincipalRepayment = Math.round(loanAmount / LOAN_MONTHS);
	let leftLoanAmount = loanAmount;
	let totalInterest = 0;
	const items = Array.from(new Array(OWN_MONTHS)).map((_, index) => {
		const result = {
			time: `${index + 1}`,
			principalRepayment: index < LOAN_MONTHS ? averagePrincipalRepayment : 0,
			interest: index < LOAN_MONTHS ? Math.round((leftLoanAmount * (LOAN_RATE * 0.01)) / 12) : 0,
			rent: Math.round(YEARLY_RENT / 12),
		};

		totalInterest += result.interest;
		result.roi = result.rent > 0 ? Math.round((result.rent) / result.interest * 100) : '-';

		if (index < LOAN_MONTHS) {
			leftLoanAmount -= averagePrincipalRepayment;
		}

		return result;
	});
	const table = new Table({
		head: [
			'期數\u200b\u200b',
			'應還本金\u200b\u200b\u200b\u200b',
			'應付利息\u200b\u200b\u200b\u200b',
			'應付本息金額\u200b\u200b\u200b\u200b\u200b\u200b',
			'收入\u200b\u200b',
			'收入-房貸\u200b\u200b\u200b\u200b',
		],
		colAligns: ['right', 'right', 'right', 'right', 'right', 'right'],
	});

	table.push(
		...items.map(item => [
			item.time % 12 === 0 ? chalk.green(item.time) : item.time,
			formatNumber(item.principalRepayment),
			formatNumber(item.interest),
			formatNumber(item.principalRepayment + item.interest),
			formatNumber(item.rent),
			formatNumber(item.rent - item.principalRepayment - item.interest),
		]),
	);

	const ownYears = OWN_MONTHS / 12;
	const totalCost = BUY_PRICE + totalInterest;

	console.log({
		買入價格: formatNumber(BUY_PRICE),
		持有年數: Math.round(ownYears * 10) / 10,
		頭期款: formatNumber(BUY_PRICE * INITIAL_AMOUNT_RATE * 0.01),
		房貸期數: LOAN_MONTHS,
		房貸利率: `${LOAN_RATE}%`,
		利息總額: formatNumber(totalInterest),
		每年租金收入: formatNumber(YEARLY_RENT),
		租金年投報率: formatNumber(
			Math.round(
				((YEARLY_RENT * ownYears) / totalCost) * 100 / ownYears * 100,
			) / 100,
		) + '%',
		售出價格: formatNumber(SELL_PRICE),
		價差年投報率: formatNumber(
			Math.round(
				((SELL_PRICE - totalCost) / totalCost) * 100 / ownYears * 100,
			) / 100,
		) + '%',
		總額年投報率: formatNumber(
			Math.round(
				(((YEARLY_RENT * ownYears) + (SELL_PRICE - totalCost)) / totalCost) * 100 / ownYears * 100,
			) / 100,
		) + '%',
	});
	console.log(table.toString());
}

function formatNumber(value) {
	if (value == null) {
		return '';
	}

	return `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

async function execute() {
	program.parse(process.argv);

	const {args} = program;

	if (args[0] === 'cal') {
		return calculateROI();
	}

	return program.help();
}

execute()
	.then(() => process.exit(0))
	.catch(error => {
		console.error(error);
		process.exit(1);
	});
