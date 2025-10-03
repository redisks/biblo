"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { User, LogOut, Settings, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from 'next/link';

export function Header() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/user");
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Вы успешно вышли из системы"); // Уведомление об успешном выходе
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Не удалось выйти из системы"); // Уведомление об ошибке
    } finally {
      setUser(null);
      setTimeout(() => (window.location.href = "/"), 1000);
    }
  };

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">📚 Библиотека</Link>

        <div className="flex items-center gap-4">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : user ? (
            <>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>
                  {user.firstName} {user.lastName}
                </span>
                {user.isAdmin && <Badge variant="secondary">Админ</Badge>}
              </div>

              {user.isAdmin && (
                <Button variant="outline" size="sm" asChild>
                  <a href="/admin">
                    <Settings className="h-4 w-4 mr-2" />
                    Админка
                  </a>
                </Button>
              )}

              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Выйти
              </Button>
            </>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href="/auth/login">Войти</a>
              </Button>
              <Button size="sm" asChild>
                <a href="/auth/register">Регистрация</a>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
