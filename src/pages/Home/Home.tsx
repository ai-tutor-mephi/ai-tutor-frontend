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
      navigate("/upload");
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="home-container">
      <div className="home-card">
        <div className="home-logo">
          <img src={logo} alt="AI Tutor logo" />
          <span>AI Tutor</span>
        </div>
        <h2>
          AI Tutor помогает быстро разобраться в ваших материалах{" "}
          <span className="highlight">и отвечает на вопросы по ним</span>.
        </h2>
        <p>
          Загружайте конспекты, статьи или отчёты — тьютор проанализирует их и
          будет отвечать на вопросы с опорой на загруженный контекст.
        </p>
        <p>
          Общайтесь в формате чата: уточняйте, просите примеры, сравнивайте
          версии. Все диалоги сохраняются, а файлы можно дополнять в любой
          момент.
        </p>
        <h1 className="cta-text">
          Попробуйте и получите ответ за пару секунд!
        </h1>
        <button className="try-button" onClick={handleClick}>
          Начать
        </button>
      </div>
    </div>
  );
};

export default Home;
