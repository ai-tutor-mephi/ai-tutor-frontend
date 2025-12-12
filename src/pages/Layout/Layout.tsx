import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import * as api from "../../services/api";
import "./Layout.css";

const Layout: React.FC = () => {
  const [userName, setUserName] = useState<string | null>(() =>
    api.isAuthenticated() ? api.getUserNameFromToken() : null
  );
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showChangeNameModal, setShowChangeNameModal] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (api.isAuthenticated()) {
      const name = api.getUserNameFromToken();
      if (name !== userName) {
        setUserName(name);
      }
    }
  }, [location.pathname, userName]);

  useEffect(() => {
    const handleClick = () => setShowProfileMenu(false);
    if (showProfileMenu) {
      window.addEventListener("click", handleClick);
      return () => window.removeEventListener("click", handleClick);
    }
  }, [showProfileMenu]);

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowProfileMenu(!showProfileMenu);
  };

  const handleChangeNameClick = () => {
    setShowProfileMenu(false);
    setShowChangeNameModal(true);
    setNewUserName(userName || "");
    setError(null);
  };

  const handleChangeEmailClick = () => {
    setShowProfileMenu(false);
    alert("Смена email пока недоступна");
  };

  const handleLogoutClick = async () => {
    setShowProfileMenu(false);
    try {
      await api.logout();
    } catch {
      api.clearTokens();
    }
    setUserName(null);
    navigate("/auth");
  };

  const handleSubmitNameChange = async () => {
    if (!newUserName.trim() || newUserName.trim().length < 3) {
      setError("Имя должно быть длиной от 3 символов");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.changeUsername(newUserName.trim());
      await api.refreshTokens();
      setUserName(newUserName.trim());
      setShowChangeNameModal(false);
    } catch (err: any) {
      setError(err.message || "Не удалось сменить имя");
    } finally {
      setLoading(false);
    }
  };

  const getInitial = (name: string | null) => {
    if (!name) return "?";
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="app">
      <nav className="navigation">
        <ul>
          <li>
            <Link to="/" className="logo">
              Mephi Tutor
            </Link>
          </li>
          <div className="nav-links">
            <li>
              <Link to="/">Главная</Link>
            </li>
            <li>
              <Link to="/about">О проекте</Link>
            </li>
            {userName && (
              <li>
                <Link to="/upload">Диалоги</Link>
              </li>
            )}
            {userName && (
              <li className="user-profile">
                <div className="profile-link" onClick={handleProfileClick}>
                  <div className="avatar-circle">{getInitial(userName)}</div>
                  <span className="user-name">{userName}</span>
                </div>

                {showProfileMenu && (
                  <div
                    className="profile-dropdown"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="dropdown-item" onClick={handleChangeNameClick}>
                      Сменить имя
                    </div>
                    <div className="dropdown-item" onClick={handleChangeEmailClick}>
                      Сменить email
                    </div>
                    <div className="dropdown-item" onClick={handleLogoutClick}>
                      Выйти
                    </div>
                  </div>
                )}
              </li>
            )}
          </div>
        </ul>
      </nav>

      <main className="content">
        <Outlet />
      </main>

      <footer>
        <div className="footer-content">
          <p>
            AITutor помогает разбирать учебные и рабочие материалы, отвечая на
            вопросы по загруженным файлам.
          </p>
          <p className="highlight">
            Загрузите документы и начните диалог — тьютор отвечает мгновенно.
          </p>
          <p>© 2025 Mephi Tutor. Все права защищены.</p>
          <p>Есть вопросы? Пишите нам в telegram: @WocherZ</p>
        </div>
      </footer>

      {showChangeNameModal && (
        <div className="modal-overlay" onClick={() => setShowChangeNameModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Сменить имя</h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowChangeNameModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-description">
                Укажите новое имя пользователя (минимум 3 символа).
              </p>
              <input
                type="text"
                className="modal-input"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Новое имя"
                minLength={3}
                maxLength={50}
                disabled={loading}
                autoFocus
              />
              {error && <div className="modal-error">{error}</div>}
            </div>
            <div className="modal-footer">
              <button
                className="modal-cancel-btn"
                onClick={() => setShowChangeNameModal(false)}
                disabled={loading}
              >
                Отмена
              </button>
              <button
                className="modal-submit-btn"
                onClick={handleSubmitNameChange}
                disabled={loading || !newUserName.trim() || newUserName.trim().length < 3}
              >
                {loading ? "Сохраняем..." : "Сохранить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
