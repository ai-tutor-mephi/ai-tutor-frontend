import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as api from "../../services/api";
import "./AuthPage.css";

type Props = {
  onAuthSuccess: () => void;
};

export const AuthPage: React.FC<Props> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      if (mode === "login") {
        await api.login(email, password);
      } else {
        await api.register(email, password);
        await api.login(email, password);
      }
      await onAuthSuccess();
      navigate("/upload");
    } catch (e: any) {
      setErr(e.message || "Ошибка");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">
          {mode === "login" ? "Авторизация" : "Регистрация"}
        </h2>
        <form className="auth-form" onSubmit={submit}>
          <div className="form-group">
            <label>Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
          </div>
          <div className="form-group">
            <label>Пароль</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
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
                onClick={() => setMode("register")}
              >
                Регистрация
              </button>
            </>
          ) : (
            <>
              Уже есть аккаунт?{" "}
              <button
                className="link-button"
                type="button"
                onClick={() => setMode("login")}
              >
                Авторизация
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
