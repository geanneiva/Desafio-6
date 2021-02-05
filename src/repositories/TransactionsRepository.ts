import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const balance: Balance = {
      income: 0,
      outcome: 0,
      total: 0,
    };

    const transactions = await this.find();

    balance.income = transactions.reduce((accumulator, transaction) => {
      if (transaction.type === 'income') {
        return accumulator + Number(transaction.value);
      }
      return accumulator;
    }, 0);

    balance.outcome = transactions.reduce((accumulator, transaction) => {
      if (transaction.type === 'outcome') {
        return accumulator + Number(transaction.value);
      }
      return accumulator;
    }, 0);

    balance.total = balance.income - balance.outcome;

    return balance;
  }
}

export default TransactionsRepository;
