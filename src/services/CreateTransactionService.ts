import AppError from '../errors/AppError';
import {getCustomRepository,getRepository} from 'typeorm';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface Request {
  title: string;
  type:'income'|'outcome';
  value:number;
  category: string;
}

class CreateTransactionService {
  public async execute({title,type,value,category}:Request):Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category)

    let transactionCategory = await categoryRepository.findOne({
      where: {
        title: category,
      }
    })

    if (!transactionCategory){
      transactionCategory = categoryRepository.create({
        title: category,
      })
      await categoryRepository.save(transactionCategory)
    }

    const balance = await transactionsRepository.getBalance()

    if (type === 'outcome' && balance.total<value){
    throw new AppError("You don't have enough money")
    }

    const transaction = transactionsRepository.create({ 
      title,
      value,
      type,
      category:transactionCategory
      
  })
  await transactionsRepository.save(transaction);
  return transaction;
}}


export default CreateTransactionService;
