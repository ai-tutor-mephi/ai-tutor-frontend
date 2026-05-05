import React from "react";
import { Link } from "react-router-dom";
import styles from "./NotFound.module.css";

const NotFound: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.animation}>
          <div className={styles.number}>404</div>
        </div>

        <h1 className={styles.title}>Страница не найдена</h1>

        <p className={styles.message}>
          Кажется, вы ищете страницу, которой у нас нет. Проверьте адрес или
          вернитесь назад.
        </p>

        <div className={styles.actions}>
          <Link to="/" className={styles.buttonPrimary}>
            На главную
          </Link>
          <button
            onClick={() => window.history.back()}
            className={styles.buttonSecondary}
          >
            Назад
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
