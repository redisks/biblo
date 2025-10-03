'use client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function ReturnBookDialog({ borrowId, onConfirm }) {
  const handleConfirm = () => {
    onConfirm(borrowId);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Вернуть книгу</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Вернуть книгу?</DialogTitle>
          <DialogDescription>
            Вы уверены, что хотите отметить книгу как возвращённую?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={handleConfirm}>
            Подтвердить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}