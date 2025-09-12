// src/components/PrivateRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";
import { User } from "../types/user";

type Props = {
  user: User | null;          // текущий пользователь
  children: React.ReactNode;  // что рендерить, если авторизован
  redirectTo?: string;        // куда перенаправить, если не авторизован
};

/**
 * PrivateRoute защищает маршруты.
 * Если user === null → делает redirect.
 * Если user есть → рендерит children.
 */
export const PrivateRoute: React.FC<Props> = ({ user, children, redirectTo = "/auth" }) => {
  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }
  return <>{children}</>;
};
