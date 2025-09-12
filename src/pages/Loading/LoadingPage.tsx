// src/pages/Loading/LoadingPage.tsx
import React from "react";
import "./LoadingPage.css";

const LoadingPage: React.FC = () => {
  return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Загрузка...</p>
    </div>
  );
};

export default LoadingPage;
