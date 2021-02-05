import Transaction from '../models/Transaction';
import csvParse from 'csv-parse';
import fs from 'fs';
import {getCustomRepository, getRepository, In} from 'typeorm';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';
interface CSVdata{
  
  title: string;
  type:'income'|'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filepath: string): Promise<Transaction[]> {
    
    const transactionsRepository = getCustomRepository (TransactionsRepository)
    const categoryRepository = getRepository (Category)
    const contactsReadStream = fs.createReadStream(filepath);
  
    const parsers = csvParse({
      from_line:2
    })

    const parseCSV = contactsReadStream.pipe(parsers)

    const transactions:CSVdata[] = []
    const categories:string[] = []

    parseCSV.on('data',async line => {
      const [title,type,value,category] = line.map((cell:string) =>
      cell.trim(),
      );

      if (!title || !type || !value) return;

      categories.push(category);
      transactions.push({title , type , value , category});
    });

    await new Promise(resolve => parseCSV.on('end',resolve))
    
    const existentCategories = await categoryRepository.find({
      where: {
          title: In(categories)
      },
    });
    
    const existingCategoriesTitles = existentCategories.map((category:Category)=>category.title);

    const addCategoryTitles = categories.filter(category => !existingCategoriesTitles
    .includes(category))
    .filter((value,index,self)=>self.indexOf(value)==index);

    const newCategory = categoryRepository.create(
      addCategoryTitles.map(title =>({
        title,
      }))
    );
    
    await categoryRepository.save(newCategory);

    const finalCategories = [...newCategory,...existentCategories];

    const createdTransactions = transactionsRepository.create(
      transactions.map(transaction =>({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title === transaction.category,

        )
      }))
    );

    await transactionsRepository.save(createdTransactions);
    
    await fs.promises.unlink(filepath);

    return createdTransactions;

  };


};
  
export default ImportTransactionsService;
