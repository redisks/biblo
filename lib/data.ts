import { connectToDatabase } from './db';
import Book from './models/Book';
import Borrow from './models/Borrow';

export async function getBooks(query = '') {
  await connectToDatabase();
  const filter = query
    ? {
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { author: { $regex: query, $options: 'i' } },
        ],
      }
    : {};

  const books = await Book.find(filter);
  for (const book of books) {
    const borrow = await Borrow.findOne({ bookId: book._id, returned: false });
    book.borrowed = borrow ? { userId: borrow.userId, returned: false } : { returned: true };
  }
  return books;
}

export async function getBookById(id: string) {
  await connectToDatabase();
  return await Book.findById(id);
}

export async function getBorrows() {
  await connectToDatabase();
  return await Borrow.find({}).populate('bookId');
}