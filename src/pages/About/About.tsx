import React from "react";
import "./About.css";

const About = () => {
  return (
    <div className="about-container">
      <section className="about-hero">
        <p className="about-kicker">AI TUTOR SYSTEM</p>
        <h1 className="about-header">Рабочая среда для вопросов по документам</h1>
        <p className="about-intro">
          AI Tutor читает ваши материалы, сохраняет диалоги и помогает быстрее
          находить смысл в конспектах, статьях и отчетах.
        </p>
      </section>

      <div className="about-features">
        <div className="feature-card">
          <div className="feature-icon">01</div>
          <h3 className="feature-title">Контекст из файлов</h3>
          <p className="feature-description">
            Поддерживаем TXT, DOCX, PDF и отвечаем с учётом ваших материалов.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">02</div>
          <h3 className="feature-title">Быстрые ответы</h3>
          <p className="feature-description">
            Обсуждайте в чате, уточняйте детали, просите примеры и сравнения.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">03</div>
          <h3 className="feature-title">Ориентир в материалах</h3>
          <p className="feature-description">
            Наводящие вопросы по разделам и ключевым понятиям помогают быстро
            найти нужное место в документах.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">04</div>
          <h3 className="feature-title">Ваши данные под защитой</h3>
          <p className="feature-description">
            Доступ к диалогам только у авторизованных пользователей.
          </p>
        </div>
      </div>

      <div className="about-team">
        <p className="about-kicker">PRODUCT NOTE</p>
        <h2 className="team-title">Простой интерфейс вместо отдельного поиска по файлам</h2>
        <p className="team-description">
          Добавляйте документы, задавайте вопросы в чате и возвращайтесь к
          сохраненным диалогам, когда нужно продолжить работу.
        </p>
      </div>

      <div className="about-content">
        <p className="about-text">
          Попробуйте загрузить свои материалы и спросить AI Tutor о том, что
          важно именно вам. Мы продолжаем развиваться, чтобы быть полезнее
          каждый день.
        </p>
      </div>
    </div>
  );
};

export default About;
