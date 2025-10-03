import { BookCard } from '@/components/BookCard'
import { SearchBar } from '@/components/SearchBar'
import { BooksPagination } from '@/components/BooksPagination'
import { Book } from '@/lib/models/Book'
import { cookies } from 'next/headers'

async function getBooks(search?: string, page?: number): Promise<{ 
  books: Book[] 
  pagination: {
    currentPage: number
    totalPages: number
    totalBooks: number
    hasNext: boolean
    hasPrev: boolean
  }
}> {
  const cookieStore = await cookies();
  const url = new URL('/api/books/sorted', process.env.NEXTAUTH_URL || 'http://localhost:3000')
  
  if (search) {
    url.searchParams.set('q', search)
  }
  if (page) {
    url.searchParams.set('page', page.toString())
  }

  const response = await fetch(url.toString(), {
    headers: {
      email: cookieStore.get("user_email")?.value ?? "",
    },
    cache: 'no-store'
  })
  
  if (!response.ok) {
    console.error('Failed to fetch books:', response.status)
    return { 
      books: [], 
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalBooks: 0,
        hasNext: false,
        hasPrev: false
      }
    }
  }
  
  return response.json()
}

interface HomePageProps {
  searchParams: Promise<{ q?: string; page?: string }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { q, page } = await searchParams
  const currentPage = parseInt(page || '1')
  
  const { books, pagination } = await getBooks(q, currentPage)

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-center mb-4">Библиотека</h1>
        <SearchBar initialValue={q} />
        
        {q && (
          <div className="text-center mt-4">
            <p className="text-muted-foreground">
              Результаты поиска по запросу: <span className="font-semibold">"{q}"</span>
              {books.length > 0 && (
                <span className="ml-2">
                  ({pagination.totalBooks} {pagination.totalBooks === 1 ? 'книга' : 
                   pagination.totalBooks >= 2 && pagination.totalBooks <= 4 ? 'книги' : 'книг'})
                </span>
              )}
            </p>
          </div>
        )}
      </div>
      
      {books.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {books.map((book) => (
              <BookCard
                key={book._id!.toString()}
                book={book}
              />
            ))}
          </div>

          <BooksPagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalBooks={pagination.totalBooks}
            hasNext={pagination.hasNext}
            hasPrev={pagination.hasPrev}
          />
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">
            {q ? 'Книги по вашему запросу не найдены' : 'В библиотеке пока нет книг'}
          </p>
          {!q && (
            <p className="text-sm text-muted-foreground mt-2">
              Добавьте книги через админ-панель
            </p>
          )}
        </div>
      )}
    </div>
  )
}