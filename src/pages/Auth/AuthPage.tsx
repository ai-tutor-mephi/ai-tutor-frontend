import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as api from "../../services/api";
import "./AuthPage.css";

type Props = {
  onAuthSuccess: () => void;
};

export const AuthPage: React.FC<Props> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      if (mode === "login") {
        await api.login(userName, password);
      } else {
        await api.register(userName, email, password);
        await api.login(userName, password);
      }
      await onAuthSuccess();
      navigate("/upload");
    } catch (e: any) {
      setErr(e.message || "Не удалось выполнить запрос");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">
          {mode === "login" ? "Вход" : "Регистрация"}
        </h2>
        <form className="auth-form" onSubmit={submit}>
          <div className="form-group">
            <label>Имя пользователя</label>
            <input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              type="text"
              required
              minLength={3}
              maxLength={50}
            />
          </div>
          {mode === "register" && (
            <div className="form-group">
              <label>Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
              />
            </div>
          )}
          <div className="form-group">
            <label>Пароль</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              minLength={8}
              maxLength={100}
            />
          </div>
          <button className="auth-button" type="submit">
            {mode === "login" ? "Войти" : "Зарегистрироваться"}
          </button>
        </form>
        {err && <div className="auth-error">{err}</div>}
        <div className="switch-mode">
          {mode === "login" ? (
            <>
              Нет аккаунта?{" "}
              <button
                className="link-button"
                type="button"
                onClick={() => {
                  setMode("register");
                  setErr(null);
                  setPassword("");
                }}
              >
                Зарегистрироваться
              </button>
            </>
          ) : (
            <>
              Уже есть аккаунт?{" "}
              <button
                className="link-button"
                type="button"
                onClick={() => {
                  setMode("login");
                  setErr(null);
                  setEmail("");
                  setPassword("");
                }}
              >
                Войти
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
