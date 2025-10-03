"use client";

import { Book } from "@/lib/models/Book";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BorrowForm } from "./BorrowForm";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface BookCardProps {
  book: Book;
}

export function BookCard({ book }: BookCardProps) {
  const [showBorrowForm, setShowBorrowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const router = useRouter();

  const handleBorrowClick = async () => {
    // Проверяем авторизацию только при клике
    const response = await fetch("/api/auth/user");
    if (response.ok) {
      const userData = await response.json();
      setShowBorrowForm(true);
    } else {
      router.push("/auth/login");
    }
  };

  const handleReturnClick = () => {
    setShowReturnDialog(true);
  };

  const handleReturnConfirm = async () => {
    setLoading(true);
    setShowReturnDialog(false);

    try {
      // Получаем пользователя для возврата
      const userResponse = await fetch("/api/auth/user");
      if (!userResponse.ok) {
        throw new Error("Пользователь не авторизован");
      }
      const user = await userResponse.json();

      // Сначала находим запись о выдаче
      const borrowsResponse = await fetch(
        `/api/borrow?bookId=${book._id}&userId=${user._id}`
      );
      if (!borrowsResponse.ok) {
        throw new Error("Не удалось найти запись о выдаче");
      }

      const borrows = await borrowsResponse.json();
      const activeBorrow = borrows.find(
        (borrow: any) => borrow.status === "active"
      );

      if (!activeBorrow) {
        throw new Error("Активная запись о выдаче не найдена");
      }

      // Возвращаем книгу
      const returnResponse = await fetch("/api/return", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ borrowId: activeBorrow._id }),
      });

      if (returnResponse.ok) {
        toast.success("Книга успешно возвращена!");
        // Плавное обновление
        setTimeout(() => {
          router.refresh();
        }, 500);
      } else {
        const error = await returnResponse.json();
        toast.error(error.error || "Ошибка при возврате книги");
      }
    } catch (error) {
      console.error("Return error:", error);
      toast.error("Ошибка при возврате книги");
    } finally {
      setLoading(false);
    }
  };

  const getButtonState = () => {
    // Используем информацию из book.isUserBook, которая пришла с сервера
    if (book.isAvailable) {
      return {
        text: "Взять книгу",
        disabled: false,
        action: handleBorrowClick,
        variant: "default" as const,
      };
    }

    if (book.isUserBook) {
      return {
        text: loading ? "Возврат..." : "Вернуть книгу",
        disabled: loading,
        action: handleReturnClick,
        variant: "outline" as const,
      };
    }

    return {
      text: "Недоступна",
      disabled: true,
      action: () => {},
      variant: "secondary" as const,
    };
  };

  const buttonState = getButtonState();

  return (
    <>
      <Card
        className={`w-full max-w-sm flex flex-col transition-all duration-300 hover:shadow-lg ${
          book.isUserBook ? "ring-2 ring-blue-200 bg-blue-50/50" : ""
        }`}
      >
        <CardHeader
          className={book.isUserBook ? "bg-blue-50/30 rounded-t-lg" : ""}
        >
          <CardTitle className="text-lg font-semibold line-clamp-2">
            {book.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 flex-1">
          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              <strong>Автор:</strong> {book.author || "Не указан"}
            </p>
            <p>
              <strong>Издательство и год:</strong>{" "}
              {book.publisher_year || "Не указано"}
            </p>{" "}
            {/* Объединенное поле */}
            <p>
              <strong>Рубрика:</strong> {book.category || "Не указана"}
            </p>
            <p>
              <strong>Место:</strong> {book.location || "Не указано"}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge variant={book.isAvailable ? "default" : "secondary"}>
              {book.isAvailable ? "Доступна" : "Выдана"}
            </Badge>
            {book.isUserBook && (
              <Badge
                variant="default"
                className="bg-green-500 hover:bg-green-600"
              >
                📚 Ваша книга
              </Badge>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={buttonState.action}
            disabled={buttonState.disabled}
            className="w-full transition-all duration-200"
            variant={buttonState.variant}
            size="lg"
          >
            {buttonState.text}
          </Button>
        </CardFooter>
      </Card>

      {/* Диалог подтверждения возврата */}
      <AlertDialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Возврат книги</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите вернуть книгу &quot;{book.title}&quot;?
              После возврата книга станет доступна для других читателей.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleReturnConfirm} disabled={loading}>
              {loading ? "Возврат..." : "Вернуть книгу"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showBorrowForm && (
        <BorrowForm book={book} onClose={() => setShowBorrowForm(false)} />
      )}
    </>
  );
}
