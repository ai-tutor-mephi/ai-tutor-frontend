import React from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import logo from "../../assets/AI_Tutor_LOGO.PNG";

type Props = {
  isAuthenticated: boolean;
};

const Home: React.FC<Props> = ({ isAuthenticated }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (isAuthenticated) {
      navigate("/dialogs");
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="home-container">
      <section className="home-hero">
        <div className="home-logo">
          <img src={logo} alt="Логотип AI Tutor" />
          <span>AI Tutor</span>
        </div>
        <h1>Учитесь по своим материалам быстрее</h1>
        <p className="home-lead">
          Загружайте документы, задавайте вопросы и проверяйте понимание с
          помощью тестов.
        </p>
        <div className="home-actions">
          <button className="try-button" onClick={handleClick}>
            Перейти к работе
          </button>
          <button className="secondary-button" onClick={() => navigate("/about")}>
            Подробнее о проекте
          </button>
        </div>
      </section>

      <section className="home-section">
        <div className="section-copy">
          <h2>Что умеет AI Tutor</h2>
        </div>
        <div className="feature-grid">
          <article className="info-card">
            <h3>Ответы по вашим файлам</h3>
            <p>
              AI Tutor учитывает загруженные материалы и отвечает в контексте
              ваших документов.
            </p>
          </article>
          <article className="info-card">
            <h3>Конспекты и тезисы</h3>
            <p>
              Получайте краткие конспекты, основные идеи и списки важных
              терминов.
            </p>
          </article>
          <article className="info-card">
            <h3>Тесты по диалогу</h3>
            <p>
              Создавайте тесты по материалам и проверяйте, насколько хорошо вы
              их поняли.
            </p>
          </article>
          <article className="info-card">
            <h3>История диалогов</h3>
            <p>
              Возвращайтесь к прошлым вопросам, ответам и созданным материалам.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
};

export default Home;
