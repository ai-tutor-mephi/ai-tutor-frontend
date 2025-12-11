import { Outlet, Link, useLocation } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import * as api from '../../services/api';
import './Layout.css';

const Layout: React.FC = () => {
  const [userName, setUserName] = useState<string | null>(() => {
    // Проверяем при первой загрузке
    if (api.isAuthenticated()) {
      return api.getUserNameFromToken();
    }
    return null;
  });
  
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showChangeNameModal, setShowChangeNameModal] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const location = useLocation();

  useEffect(() => {
    // Проверяем авторизацию при изменении маршрута
    if (api.isAuthenticated()) {
      const name = api.getUserNameFromToken();
      if (name !== userName) {
        setUserName(name);
      }
    } else {
      // ВРЕМЕННО: для тестирования UI без авторизации
      if (location.pathname === '/upload' && !userName) {
        setUserName('Тестовый пользователь');
      } else if (location.pathname !== '/upload') {
        // Сохраняем userName для других страниц, если он уже был установлен
        // чтобы кнопка "Диалоги" оставалась видимой
      }
    }
  }, [location.pathname, userName]);

  // Закрытие меню при клике вне его
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
    alert("Функция смены почты находится в разработке");
  };

  const handleSubmitNameChange = async () => {
    if (!newUserName.trim() || newUserName.trim().length < 3) {
      setError("Имя должно содержать минимум 3 символа");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.changeUsername(newUserName.trim());
      setUserName(newUserName.trim());
      setShowChangeNameModal(false);
      window.location.reload(); // Перезагружаем для обновления токена
    } catch (err: any) {
      setError(err.message || "Ошибка изменения имени");
    } finally {
      setLoading(false);
    }
  };

  // Получить первую букву имени для аватара
  const getInitial = (name: string | null) => {
    if (!name) return '?';
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
              <Link to="/about">О нас</Link>
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
                
                {/* Выпадающее меню профиля */}
                {showProfileMenu && (
                  <div className="profile-dropdown" onClick={(e) => e.stopPropagation()}>
                    <div className="dropdown-item" onClick={handleChangeNameClick}>
                      ✏️ Сменить имя
                    </div>
                    <div className="dropdown-item" onClick={handleChangeEmailClick}>
                      📧 Сменить почту
                    </div>
                  </div>
                )}
              </li>
            )}
          </div>
        </ul>
      </nav>
      
      <main className="content">
        <Outlet /> {/* Здесь будут рендериться дочерние маршруты */}
      </main>
      
      <footer>
        <div className="footer-content">
          <p>Проект разработан инициативной командой студентов НИЯУ МИФИ</p>
          <p className="highlight">Не имеет коммерческой основы · Создано для образовательных целей</p>
          <p>© 2025 Mephi Tutor. Все права защищены.</p>
        </div>
      </footer>

      {/* Модальное окно смены имени */}
      {showChangeNameModal && (
        <div className="modal-overlay" onClick={() => setShowChangeNameModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Изменить имя пользователя</h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowChangeNameModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-description">
                Введите новое имя пользователя (минимум 3 символа)
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
                {loading ? "Сохранение..." : "Сохранить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;