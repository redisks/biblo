import { ObjectId } from 'mongodb'

export interface CurrentHolder {
  userName: string
  userEmail: string
  userTelegram?: string
  borrowDate: Date
  dueDate: Date
}

export interface Book {
  _id?: ObjectId
  author?: string
  title: string
  publisher_year?: string // Объединяем в одно поле
  category?: string
  location?: string
  isAvailable: boolean
  createdAt: Date
  isUserBook?: boolean
  currentHolder?: CurrentHolder
}

export interface BookCreate {
  author?: string
  title: string
  publisher_year?: string // Объединяем в одно поле
  category?: string
  location?: string
}