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
          <img src={logo} alt="AI Tutor logo" />
          <span>AI Tutor</span>
        </div>
        <h1>
          AI Tutor помогает быстро разобраться в ваших материалах.
        </h1>
        <p className="home-lead">
          Загружайте конспекты, статьи или отчёты. Тьютор анализирует документы
          и отвечает на вопросы с опорой на загруженный контекст.
        </p>
        <div className="home-actions">
          <button className="try-button" onClick={handleClick}>
            Начать работу
          </button>
          <button className="secondary-button" onClick={() => navigate("/about")}>
            Как это работает
          </button>
        </div>
      </section>

      <section className="home-media-grid" aria-label="Возможности AI Tutor">
        <div className="agent-console-card">
          <div className="console-topline">
            <span>DOCUMENT AGENT</span>
            <span className="status-chip">Active</span>
          </div>
          <div className="console-prompt">
            <p>Вопрос</p>
            <strong>Сравни выводы из главы 2 и отчета за апрель.</strong>
          </div>
          <div className="console-answer">
            <span>Ответ AI Tutor</span>
            <p>
              В обоих материалах главный риск связан с неполными исходными
              данными. В отчете он описан через метрики, в главе 2 — через
              методологию проверки.
            </p>
          </div>
          <div className="console-files">
            <span>lecture.pdf</span>
            <span>report.docx</span>
            <span>notes.txt</span>
          </div>
        </div>

        <div className="hero-photo-card">
          <div className="document-stack">
            <div className="document-card primary">
              <span>01</span>
              <p>Загрузка материалов</p>
            </div>
            <div className="document-card">
              <span>02</span>
              <p>Диалог с контекстом</p>
            </div>
            <div className="document-card">
              <span>03</span>
              <p>Сохраненные ответы</p>
            </div>
          </div>
        </div>
      </section>

      <section className="trust-strip">
        <p>Один рабочий поток для учебных материалов, статей и отчетов</p>
        <div className="trust-items">
          <span>TXT</span>
          <span>DOCX</span>
          <span>PDF</span>
          <span>CHAT</span>
          <span>HISTORY</span>
        </div>
      </section>
    </div>
  );
};

export default Home;
