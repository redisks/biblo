'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Book, BookCreate } from '@/lib/models/Book'
import { Loader2, Plus, Trash2, Search, User, Mail, Calendar, Edit, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

interface AdminContentProps {
  user: any
}

export default function AdminContent({ user }: AdminContentProps) {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [editingBookId, setEditingBookId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<Book> | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [newBook, setNewBook] = useState<BookCreate>({
    title: '',
    author: '',
    publisher_year: '',
    category: '',
    location: ''
  })

  // Debounce для поиска
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    loadBooks()
  }, [debouncedSearch])

  const loadBooks = async () => {
    setLoading(true)
    try {
      const url = new URL('/api/books', window.location.origin)
      url.searchParams.set('admin', 'true')
      if (debouncedSearch) {
        url.searchParams.set('q', debouncedSearch)
      }

      const response = await fetch(url.toString())
      if (response.ok) {
        const data = await response.json()
        setBooks(data.books || [])
      } else {
        toast.error('Не удалось загрузить книги')
      }
    } catch (error) {
      console.error('Error loading books:', error)
      toast.error('Ошибка при загрузке книг')
    } finally {
      setLoading(false)
    }
  }

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newBook),
      })

      if (response.ok) {
        setNewBook({
          title: '',
          author: '',
          publisher_year: '',
          category: '',
          location: ''
        })
        setShowAddForm(false)
        loadBooks()
        toast.success('Книга добавлена успешно!')
      } else {
        toast.error('Ошибка при добавлении книги')
      }
    } catch (error) {
      toast.error('Ошибка при добавлении книги')
    }
  }

  const handleDeleteClick = (book: Book) => {
    setBookToDelete(book)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!bookToDelete) return

    setDeleteLoading(true)
    try {
      const response = await fetch(`/api/books/${bookToDelete._id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        loadBooks()
        toast.success('Книга удалена успешно!')
      } else {
        toast.error('Ошибка при удалении книги')
      }
    } catch (error) {
      toast.error('Ошибка при удалении книги')
    } finally {
      setDeleteLoading(false)
      setShowDeleteDialog(false)
      setBookToDelete(null)
    }
  }

  const handleEditClick = (book: Book) => {
    setEditingBookId(book._id!.toString())
    setEditFormData({
      title: book.title,
      author: book.author,
      publisher_year: book.publisher_year,
      category: book.category,
      location: book.location
    })
  }

  const handleEditCancel = () => {
    setEditingBookId(null)
    setEditFormData(null)
  }

  const handleEditSave = async (bookId: string) => {
    if (!editFormData) return

    setEditLoading(true)
    try {
      const response = await fetch(`/api/books/${bookId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      })

      if (response.ok) {
        await loadBooks()
        setEditingBookId(null)
        setEditFormData(null)
        toast.success('Книга обновлена успешно!')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Ошибка при обновлении книги')
      }
    } catch (error) {
      toast.error('Ошибка при обновлении книги')
    } finally {
      setEditLoading(false)
    }
  }

  const handleEditChange = (field: keyof Book, value: string) => {
    if (editFormData) {
      setEditFormData(prev => ({
        ...prev,
        [field]: value || undefined
      }))
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Админ-панель</h1>
          <p className="text-muted-foreground mt-2">
            Добро пожаловать, {user.firstName} {user.lastName}
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Добавить книгу
        </Button>
      </div>

      {/* Поиск в админке */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Поиск книг..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={clearSearch}
            >
              ×
            </Button>
          )}
        </div>
      </div>

      {showAddForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Добавить новую книгу</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddBook} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Название *</Label>
                  <Input
                    id="title"
                    value={newBook.title}
                    onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="author">Автор</Label>
                  <Input
                    id="author"
                    value={newBook.author}
                    onChange={(e) => setNewBook({...newBook, author: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="publisher_year">Издательство и год</Label>
                  <Input
                    id="publisher_year"
                    value={newBook.publisher_year}
                    onChange={(e) => setNewBook({...newBook, publisher_year: e.target.value})}
                    placeholder="Например: Эксмо, 2023"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Рубрика</Label>
                  <Input
                    id="category"
                    value={newBook.category}
                    onChange={(e) => setNewBook({...newBook, category: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="location">Место</Label>
                  <Input
                    id="location"
                    value={newBook.location}
                    onChange={(e) => setNewBook({...newBook, location: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Добавить книгу</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Отмена
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            Список книг ({books.length})
            {debouncedSearch && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                по запросу "{debouncedSearch}"
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {books.map((book) => (
              <div key={book._id!.toString()} className="flex items-start justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  {editingBookId === book._id!.toString() ? (
                    // Режим редактирования
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="edit-title">Название *</Label>
                          <Input
                            id="edit-title"
                            value={editFormData?.title || ''}
                            onChange={(e) => handleEditChange('title', e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-author">Автор</Label>
                          <Input
                            id="edit-author"
                            value={editFormData?.author || ''}
                            onChange={(e) => handleEditChange('author', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-publisher_year">Издательство и год</Label>
                          <Input
                            id="edit-publisher_year"
                            value={editFormData?.publisher_year || ''}
                            onChange={(e) => handleEditChange('publisher_year', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-category">Рубрика</Label>
                          <Input
                            id="edit-category"
                            value={editFormData?.category || ''}
                            onChange={(e) => handleEditChange('category', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-location">Место</Label>
                          <Input
                            id="edit-location"
                            value={editFormData?.location || ''}
                            onChange={(e) => handleEditChange('location', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleEditSave(book._id!.toString())}
                          disabled={editLoading}
                        >
                          {editLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          Сохранить
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={handleEditCancel}
                          disabled={editLoading}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Отмена
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Режим просмотра
                    <>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{book.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            <strong>Автор:</strong> {book.author || 'Не указан'} • 
                            <strong> Издательство и год:</strong> {book.publisher_year || 'Не указано'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <strong>Рубрика:</strong> {book.category || 'Не указана'} • 
                            <strong> Место:</strong> {book.location || 'Не указано'}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Badge variant={book.isAvailable ? "default" : "secondary"}>
                            {book.isAvailable ? 'Доступна' : 'Выдана'}
                          </Badge>
                        </div>
                      </div>

                      {/* Информация о текущем держателе */}
                      {!book.isAvailable && book.currentHolder && (
                        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                          <h4 className="font-medium text-amber-800 mb-2 flex items-center">
                            <User className="h-4 w-4 mr-2" />
                            Книга выдана:
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <div>
                              <strong>Читатель:</strong> {book.currentHolder.userName}
                            </div>
                            <div className="flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              <strong>Email:</strong> {book.currentHolder.userEmail}
                            </div>
                            {book.currentHolder.userTelegram && (
                              <div>
                                <strong>Telegram:</strong> {book.currentHolder.userTelegram}
                              </div>
                            )}
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              <strong>Вернуть до:</strong> {format(new Date(book.currentHolder.dueDate), 'dd.MM.yyyy')}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                {editingBookId !== book._id!.toString() && (
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(book)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(book)}
                      disabled={deleteLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {books.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {debouncedSearch ? 'Книги по вашему запросу не найдены' : 'В библиотеке пока нет книг'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Диалог подтверждения удаления */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удаление книги</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить книгу &quot;{bookToDelete?.title}&quot;? 
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Отмена</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading ? "Удаление..." : "Удалить книгу"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}