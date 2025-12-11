import React from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css"; // Подключаем стили

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
        <h2>
          Искусственный интеллект <span className="highlight">в образовании</span> играет важную роль!
        </h2>
        <p>
          Наш проект создан, чтобы <span className="highlight">упростить подготовку студентов к экзаменам</span>,
          а преподавателям помочь <span className="highlight">в создании учебных материалов</span>.
        </p>
        <p>
          Умный ИИ-тьютор сможет помочь вам <span className="highlight">решать задачи, объяснять сложные темы </span>
          и подсказывать <span className="highlight">лучшие способы обучения</span>.
        </p>
        <h1 className="cta-text">Попробуйте умного ИИ-тьютора уже сейчас!</h1>
        <button className="try-button" onClick={handleClick}>
          Попробовать
        </button>
      </div>
    </div>
  );
};

export default Home;
