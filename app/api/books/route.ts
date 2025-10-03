import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import clientPromise from '@/lib/db'
import { Book, BookCreate } from '@/lib/models/Book'

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db('library')
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const isAdmin = searchParams.get('admin') === 'true'
    const limit = isAdmin ? 100 : 8
    const skip = isAdmin ? 0 : (page - 1) * limit

    let filter = {}
    if (query) {
      filter = {
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { author: { $regex: query, $options: 'i' } },
          { publisher_year: { $regex: query, $options: 'i' } }, // Обновляем поле
          { category: { $regex: query, $options: 'i' } }
        ]
      }
    }

    // ... остальная логика API без изменений, кроме использования publisher_year
    let books
    if (isAdmin) {
      books = await db.collection('books').aggregate([
        { $match: filter },
        {
          $lookup: {
            from: 'borrows',
            let: { bookId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$bookId', '$$bookId'] },
                  status: 'active'
                }
              },
              {
                $lookup: {
                  from: 'users',
                  localField: 'userId',
                  foreignField: '_id',
                  as: 'user'
                }
              },
              { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
              {
                $project: {
                  userName: 1,
                  userEmail: 1,
                  userTelegram: 1,
                  borrowDate: 1,
                  dueDate: 1,
                  'user.firstName': 1,
                  'user.lastName': 1,
                  'user.email': 1,
                  'user.telegram': 1
                }
              }
            ],
            as: 'activeBorrows'
          }
        },
        {
          $addFields: {
            currentHolder: { $arrayElemAt: ['$activeBorrows', 0] }
          }
        },
        { $sort: { title: 1 } }
      ]).toArray()
    } else {
      books = await db
        .collection<Book>('books')
        .find(filter)
        .sort({ title: 1 })
        .skip(skip)
        .limit(limit)
        .toArray()
    }

    const total = await db.collection<Book>('books').countDocuments(filter)
    
    if (isAdmin) {
      return NextResponse.json({
        books,
        totalBooks: total
      })
    } else {
      const totalPages = Math.ceil(total / limit)
      return NextResponse.json({
        books,
        pagination: {
          currentPage: page,
          totalPages,
          totalBooks: total,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      })
    }
  } catch (error) {
    console.error('Books API error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db('library')
    const bookData: BookCreate = await request.json()

    const book: Book = {
      ...bookData,
      isAvailable: true,
      createdAt: new Date()
    }

    const result = await db.collection<Book>('books').insertOne(book)
    return NextResponse.json({ _id: result.insertedId, ...book })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}