import { Outlet, Link } from 'react-router-dom';
import React from 'react';
import './Layout.css';

const Layout: React.FC = () => {
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
            {/* Можно добавить дополнительные ссылки позже */}
            {/* <li><Link to="/contact">Контакты</Link></li> */}
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
    </div>
  );
};

export default Layout;