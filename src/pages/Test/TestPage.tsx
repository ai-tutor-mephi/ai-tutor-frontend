import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import * as api from "../../services/api";
import ErrorToast from "../../components/ErrorToast";
import "./TestPage.css";

type AnswersByQuestion = Record<number, string>;

const TestPage: React.FC = () => {
  const { dialogId, testId } = useParams();
  const navigate = useNavigate();
  const numericDialogId = Number(dialogId);
  const numericTestId = Number(testId);

  const [quiz, setQuiz] = useState<api.QuizResponse | null>(null);
  const [answers, setAnswers] = useState<AnswersByQuestion>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [result, setResult] = useState<api.QuizScoreResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadQuiz = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getQuiz(numericDialogId, numericTestId);
      setQuiz(data);
      setAnswers({});
      setResult(null);
      setCurrentIndex(0);
    } catch (err: any) {
      setError(api.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [numericDialogId, numericTestId]);

  useEffect(() => {
    if (!Number.isFinite(numericDialogId) || !Number.isFinite(numericTestId)) {
      setError("Некорректный адрес теста");
      setLoading(false);
      return;
    }

    loadQuiz();
  }, [loadQuiz, numericDialogId, numericTestId]);

  const questions = quiz?.questions || [];
  const currentQuestion = questions[currentIndex];
  const selectedAnswer = currentQuestion ? answers[currentQuestion.id] : "";
  const progress = questions.length
    ? ((currentIndex + 1) / questions.length) * 100
    : 0;

  const resultByQuestion = useMemo(() => {
    const map = new Map<number, api.QuizQuestionScoreResponse>();
    result?.questions.forEach((question) => {
      map.set(question.questionId, question);
    });
    return map;
  }, [result]);

  const handleAnswer = (answer: string) => {
    if (!currentQuestion || result) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: answer }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((index) => index + 1);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex((index) => index - 1);
    }
  };

  const handleFinish = async () => {
    if (!quiz || !currentQuestion || !selectedAnswer) return;

    setSubmitting(true);
    setError(null);

    try {
      const payload = quiz.questions.map((question) => ({
        questionId: question.id,
        answer: answers[question.id],
      }));
      const score = await api.scoreQuiz(numericTestId, payload);
      setResult(score);
    } catch (err: any) {
      setError(api.getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    setAnswers({});
    setResult(null);
    setCurrentIndex(0);
    setError(null);
  };

  if (loading) {
    return (
      <div className="test-page">
        <ErrorToast message={error} onDismiss={() => setError(null)} />
        <div className="test-state">Загружаем тест...</div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="test-page">
        <ErrorToast message={error} onDismiss={() => setError(null)} />
        <div className="test-state">
          <p>Не удалось загрузить тест.</p>
          <button type="button" onClick={loadQuiz}>
            Попробовать снова
          </button>
          <Link to="/dialogs">К диалогам</Link>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="test-page">
        <ErrorToast message={error} onDismiss={() => setError(null)} />
        <div className="test-state">
          <p>В этом тесте нет вопросов.</p>
          <Link to="/dialogs">К диалогам</Link>
        </div>
      </div>
    );
  }

  if (result) {
    const percent =
      result.totalQuestions > 0
        ? Math.round((result.correctAnswers / result.totalQuestions) * 100)
        : 0;

    return (
      <div className="test-page">
        <ErrorToast message={error} onDismiss={() => setError(null)} />
        <header className="test-header">
          <button type="button" onClick={() => navigate("/dialogs")}>
            К диалогам
          </button>
          <div>
            <p>Результат теста</p>
            <h1>{quiz.test_name}</h1>
          </div>
          <button type="button" onClick={handleRetake}>
            Пройти заново
          </button>
        </header>

        <main className="test-result">
          <section className="result-summary">
            <h2>
              Ваш результат: {result.correctAnswers} из {result.totalQuestions}
            </h2>
            <p>Результат: {percent}%</p>
          </section>

          <section className="result-list">
            {quiz.questions.map((question) => {
              const scored = resultByQuestion.get(question.id);
              const selectedResultAnswer =
                scored?.selectedAnswer || answers[question.id] || "-";
              return (
                <article
                  key={question.id}
                  className={`result-card ${scored?.correct ? "correct" : "incorrect"}`}
                >
                  <h3>{question.question}</h3>
                  <p className="result-status">
                    {scored?.correct ? "Верно" : "Неверно"}
                  </p>
                  <div
                    className={`result-answer ${
                      scored?.correct ? "answer-correct" : "answer-incorrect"
                    }`}
                  >
                    <span>Ваш ответ</span>
                    <strong>{selectedResultAnswer}</strong>
                  </div>
                  {!scored?.correct && (
                    <div className="result-answer answer-correct">
                      <span>Правильный ответ</span>
                      <strong>{scored?.correctAnswer}</strong>
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="test-page">
      <ErrorToast message={error} onDismiss={() => setError(null)} />
      <header className="test-header">
        <div>
          <p>Тест</p>
          <h1>{quiz.test_name}</h1>
        </div>
      </header>

      <main className="test-shell">
        <div className="test-progress">
          <div className="progress-copy">
            <span>
              Вопрос {currentIndex + 1} из {questions.length}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <section className="question-card">
          <h2>{currentQuestion.question}</h2>
          <div className="answer-list">
            {currentQuestion.variants.map((variant) => (
              <button
                key={variant}
                type="button"
                className={`answer-option ${
                  selectedAnswer === variant ? "selected" : ""
                }`}
                onClick={() => handleAnswer(variant)}
              >
                {variant}
              </button>
            ))}
          </div>
        </section>

        <div className="test-actions">
          <button
            type="button"
            className="dialog-link-action"
            onClick={() => navigate("/dialogs")}
          >
            К диалогам
          </button>
          <div className="test-step-actions">
            <button type="button" onClick={handleBack} disabled={currentIndex === 0}>
              Назад
            </button>
            {currentIndex === questions.length - 1 ? (
              <button
                type="button"
                className="primary"
                onClick={handleFinish}
                disabled={!selectedAnswer || submitting}
              >
                {submitting ? "Проверка..." : "Завершить тест"}
              </button>
            ) : (
              <button
                type="button"
                className="primary"
                onClick={handleNext}
                disabled={!selectedAnswer}
              >
                Далее
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TestPage;
