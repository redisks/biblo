import { getBookById } from '@/lib/data';
import BorrowForm from '@/components/BorrowForm';

export default async function BorrowPage({ params }: {params: {id: string}}) {
  const book = await getBookById(params.id);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-xl font-bold">Взять книгу: {book.title}</h1>
      <BorrowForm bookId={book._id} />
    </div>
  );
}