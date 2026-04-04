export type UserRole = "Новичок" | "Администратор" | "Разработчик" | "Контентмейкер";

export interface User {
  id: string;
  username: string;
  role: UserRole;
  registrationDate: string;
  balance: number;
  lastIdChangeDate: string | null;
}

export interface Transaction {
  userId: string;
  date: string;
  type: string;
  amount: number;
}

export const ROLE_STYLES: Record<UserRole, string> = {
  "Новичок": "bg-blue-100 text-blue-700 border-blue-200",
  "Администратор": "bg-red-100 text-red-700 border-red-200",
  "Разработчик": "bg-green-100 text-green-700 border-green-200",
  "Контентмейкер": "bg-pink-100 text-pink-700 border-pink-200",
};
