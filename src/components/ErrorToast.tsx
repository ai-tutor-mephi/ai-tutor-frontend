import React from "react";
import "./ErrorToast.css";

type ErrorToastProps = {
  message: string | null;
  onDismiss: () => void;
};

const ErrorToast: React.FC<ErrorToastProps> = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div className="error-toast" role="alert" aria-live="assertive">
      <p>{message}</p>
      <button
        type="button"
        className="error-toast-close"
        onClick={onDismiss}
        aria-label="Скрыть ошибку"
        title="Скрыть ошибку"
      >
        ×
      </button>
    </div>
  );
};

export default ErrorToast;
