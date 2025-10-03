import { parse } from 'csv-parse/sync'
import { readFileSync } from 'fs'
import clientPromise from '../lib/db'

interface CSVBook {
  автор: string
  название: string
  'издательство, год': string
  рубрика: string
  'где стоит': string
}

async function importCSV() {
  try {
    const client = await clientPromise
    const db = client.db('library')
    const booksCollection = db.collection('books')

    // Читаем CSV файл
    const csvData = readFileSync('books.csv', 'utf-8')
    
    const records: CSVBook[] = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    })

    const books = records.map(record => ({
      author: record.автор || undefined,
      title: record.название,
      publisher_year: record['издательство, год'] || undefined,
      category: record.рубрика || undefined,
      location: record['где стоит'] || undefined,
      isAvailable: true,
      createdAt: new Date()
    }))

    if (books.length > 0) {
      const result = await booksCollection.insertMany(books)
      console.log(`Успешно импортировано ${result.insertedCount} книг`)
    } else {
      console.log('Нет данных для импорта')
    }

    process.exit(0)
  } catch (error) {
    console.error('Ошибка импорта:', error)
    process.exit(1)
  }
}

importCSV()