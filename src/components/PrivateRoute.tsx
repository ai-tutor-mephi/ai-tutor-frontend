// src/components/PrivateRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";

type Props = {
  isAuthenticated: boolean;   // авторизован ли пользователь
  children: React.ReactNode;  // что рендерить, если авторизован
  redirectTo?: string;        // куда перенаправить, если не авторизован
};

/**
 * PrivateRoute защищает маршруты.
 * Если isAuthenticated === false → делает redirect.
 * Если isAuthenticated === true → рендерит children.
 */
export const PrivateRoute: React.FC<Props> = ({ 
  isAuthenticated, 
  children, 
  redirectTo = "/auth" 
}) => {
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }
  return <>{children}</>;
};
