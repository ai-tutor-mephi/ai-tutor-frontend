import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import * as api from "../../services/api";
import "./UploadPage.css";

type Props = { onLogout: () => void };

const MIN_SIDEBAR_WIDTH = 240;
const MAX_SIDEBAR_WIDTH = 420;

const PROMPT_SUGGESTIONS = [
  "Сделай конспект",
  "Выдели основные тезисы из материалов",
  "Объясни материал простыми словами",
  "Составь список важных терминов",
];

function validateFiles(files: File[]): string | null {
  const allowedExtensions = [".txt", ".docx", ".pdf"];
  const invalidFiles = files.filter((file) => {
    const extension = "." + file.name.split(".").pop()?.toLowerCase();
    return !allowedExtensions.includes(extension);
  });

  if (invalidFiles.length === 0) return null;
  return `Можно загружать только TXT, DOCX, PDF. Проверьте файлы: ${invalidFiles
    .map((file) => file.name)
    .join(", ")}`;
}

export const UploadPage: React.FC<Props> = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(300);

  const [dialogs, setDialogs] = useState<api.DialogInfo[]>([]);
  const [currentDialogId, setCurrentDialogId] = useState<number | null>(null);
  const [messages, setMessages] = useState<api.DialogMessagesDto[]>([]);
  const [currentFiles, setCurrentFiles] = useState<api.FileResponse[]>([]);
  const [quizzes, setQuizzes] = useState<api.QuizResponse[]>([]);
  const [inputText, setInputText] = useState("");
  const [createFiles, setCreateFiles] = useState<File[]>([]);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [suggestionsCollapsed, setSuggestionsCollapsed] = useState(false);
  const [leftMobileOpen, setLeftMobileOpen] = useState(false);
  const [rightMobileOpen, setRightMobileOpen] = useState(false);
  const [loadingDialogs, setLoadingDialogs] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [creatingDialog, setCreatingDialog] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showGenerateQuiz, setShowGenerateQuiz] = useState(false);
  const [questionsCount, setQuestionsCount] = useState(10);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    dialogId: number | null;
  }>({ visible: false, x: 0, y: 0, dialogId: null });
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameDialogId, setRenameDialogId] = useState<number | null>(null);
  const [newDialogTitle, setNewDialogTitle] = useState("");

  const userName = api.getUserNameFromToken();
  const selectedDialog = useMemo(
    () => dialogs.find((dialog) => dialog.dialogId === currentDialogId) || null,
    [dialogs, currentDialogId]
  );

  useEffect(() => {
    loadDialogs();
  }, []);

  useEffect(() => {
    if (currentDialogId !== null) {
      loadMessages(currentDialogId);
      loadDialogFiles(currentDialogId);
      loadQuizzes(currentDialogId);
      setRightCollapsed(false);
    } else {
      setMessages([]);
      setCurrentFiles([]);
      setQuizzes([]);
    }
  }, [currentDialogId]);

  useEffect(() => {
    const handleClick = () =>
      setContextMenu({ visible: false, x: 0, y: 0, dialogId: null });
    if (contextMenu.visible) {
      window.addEventListener("click", handleClick);
      return () => window.removeEventListener("click", handleClick);
    }
  }, [contextMenu.visible]);

  const loadDialogs = async () => {
    setLoadingDialogs(true);
    try {
      const data = await api.getDialogs();
      setDialogs(data);
    } catch (err: any) {
      setError(err.message || "Не удалось загрузить список диалогов");
    } finally {
      setLoadingDialogs(false);
    }
  };

  const loadMessages = async (dialogId: number) => {
    setLoadingMessages(true);
    try {
      const data = await api.getDialogMessages(dialogId);
      setMessages(data.dialogMessages);
    } catch (err: any) {
      setError(err.message || "Не удалось загрузить сообщения диалога");
    } finally {
      setLoadingMessages(false);
    }
  };

  const loadDialogFiles = async (dialogId: number) => {
    setLoadingFiles(true);
    try {
      const files = await api.getDialogFiles(dialogId);
      setCurrentFiles(files);
    } catch (err: any) {
      setError(err.message || "Не удалось загрузить файлы диалога");
      setCurrentFiles([]);
    } finally {
      setLoadingFiles(false);
    }
  };

  const loadQuizzes = async (dialogId: number) => {
    setLoadingQuizzes(true);
    try {
      const data = await api.getDialogQuizzes(dialogId);
      setQuizzes(data);
    } catch (err: any) {
      setError(err.message || "Не удалось загрузить тесты диалога");
      setQuizzes([]);
    } finally {
      setLoadingQuizzes(false);
    }
  };

  const handleFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
    target: "create" | "upload"
  ) => {
    const files = Array.from(event.target.files || []);
    const validationError = validateFiles(files);
    if (validationError) {
      setError(validationError);
      event.target.value = "";
      return;
    }

    if (target === "create") {
      setCreateFiles(files);
    } else {
      setUploadFiles(files);
    }
    setError(null);
  };

  const handleCreateDialogWithFiles = async () => {
    if (createFiles.length === 0) {
      setError("Выберите файлы, чтобы создать диалог");
      return;
    }

    setCreatingDialog(true);
    setError(null);

    try {
      const dialog = await api.createDialogWithFiles(createFiles);
      setCurrentDialogId(dialog.dialogId);
      setCreateFiles([]);
      setShowCreateDialog(false);
      await loadDialogs();
    } catch (err: any) {
      setError(err.message || "Не удалось создать диалог");
    } finally {
      setCreatingDialog(false);
    }
  };

  const handleUploadFilesToDialog = async () => {
    if (!currentDialogId) {
      setError("Выберите диалог, чтобы загрузить файлы");
      return;
    }
    if (uploadFiles.length === 0) {
      setError("Добавьте файлы для загрузки");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      await api.uploadFilesToDialog(currentDialogId, uploadFiles);
      setUploadFiles([]);
      await loadDialogFiles(currentDialogId);
    } catch (err: any) {
      setError(err.message || "Не удалось загрузить файлы");
    } finally {
      setUploading(false);
    }
  };

  const handleSendMessage = async () => {
    const question = inputText.trim();
    if (!question) return;
    if (!currentDialogId) {
      setError("Выберите диалог, чтобы отправлять сообщения");
      return;
    }

    setSending(true);
    setError(null);

    try {
      const response = await api.sendMessage(currentDialogId, question);
      setMessages((prev) => [
        ...prev,
        { message: question, role: "USER" },
        { message: response.answer, role: "BOT" },
      ]);
      setInputText("");
    } catch (err: any) {
      setError(err.message || "Не удалось отправить сообщение");
    } finally {
      setSending(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!currentDialogId) {
      setError("Выберите диалог, чтобы создать тест");
      return;
    }
    if (questionsCount < 1 || questionsCount > 20) {
      setError("Количество вопросов должно быть от 1 до 20");
      return;
    }

    setGeneratingQuiz(true);
    setError(null);

    try {
      const quiz = await api.generateQuiz(currentDialogId, questionsCount);
      await loadQuizzes(currentDialogId);
      setShowGenerateQuiz(false);
      navigate(`/dialogs/${currentDialogId}/tests/${quiz.id}`);
    } catch (err: any) {
      setError(err.message || "Не удалось создать тест");
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleDeleteDialog = async (dialogId: number) => {
    if (
      !window.confirm(
        "Удалить диалог? Файлы и переписка будут удалены безвозвратно."
      )
    ) {
      return;
    }

    try {
      await api.deleteDialog(dialogId);
      if (currentDialogId === dialogId) {
        setCurrentDialogId(null);
      }
      await loadDialogs();
    } catch (err: any) {
      setError(err.message || "Не удалось удалить диалог");
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      api.clearTokens();
    }
    onLogout();
    navigate("/auth");
  };

  const handleContextMenu = (event: React.MouseEvent, dialogId: number) => {
    event.preventDefault();
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      dialogId,
    });
  };

  const handleRenameDialog = () => {
    if (contextMenu.dialogId !== null) {
      const dialog = dialogs.find((item) => item.dialogId === contextMenu.dialogId);
      if (dialog) {
        setRenameDialogId(contextMenu.dialogId);
        setNewDialogTitle(dialog.title);
        setShowRenameModal(true);
      }
    }
    setContextMenu({ visible: false, x: 0, y: 0, dialogId: null });
  };

  const handleSubmitRename = async () => {
    if (!renameDialogId || !newDialogTitle.trim()) {
      setError("Введите новое название диалога");
      return;
    }

    setError(null);

    try {
      await api.changeDialogTitle(renameDialogId, newDialogTitle.trim());
      await loadDialogs();
      setShowRenameModal(false);
    } catch (err: any) {
      setError(err.message || "Не удалось переименовать диалог");
    }
  };

  const handleDeleteFromContextMenu = () => {
    if (contextMenu.dialogId !== null) {
      handleDeleteDialog(contextMenu.dialogId);
    }
    setContextMenu({ visible: false, x: 0, y: 0, dialogId: null });
  };

  const startResize = (event: React.MouseEvent<HTMLDivElement>) => {
    resizeStartX.current = event.clientX;
    resizeStartWidth.current = sidebarWidth;

    const handleMove = (moveEvent: MouseEvent) => {
      const nextWidth =
        resizeStartWidth.current + moveEvent.clientX - resizeStartX.current;
      setSidebarWidth(
        Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, nextWidth))
      );
    };

    const handleUp = () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  };

  const selectDialog = (dialogId: number) => {
    setCurrentDialogId(dialogId);
    setLeftMobileOpen(false);
  };

  const insertPromptSuggestion = (suggestion: string) => {
    setInputText(suggestion);
    setRightMobileOpen(false);
  };

  const openLeftMobilePanel = () => setLeftMobileOpen(true);

  const openRightMobilePanel = () => {
    setRightCollapsed(false);
    setRightMobileOpen(true);
  };

  const renderSidebarNavigation = () => (
    <nav className="sidebar-nav" aria-label="Основная навигация">
      <Link className="sidebar-nav-link" to="/">
        Главная
      </Link>
      <Link className="sidebar-nav-link" to="/about">
        О проекте
      </Link>
      <Link
        className={`sidebar-nav-link ${
          location.pathname.startsWith("/dialogs") || location.pathname.startsWith("/upload")
            ? "active"
            : ""
        }`}
        to="/dialogs"
      >
        Диалоги
      </Link>
    </nav>
  );

  const renderMobilePanelButtons = () => (
    <div className="mobile-chat-actions">
      <button type="button" className="mobile-panel-btn" onClick={openLeftMobilePanel}>
        Диалоги
      </button>
      <button
        type="button"
        className="mobile-panel-btn"
        onClick={openRightMobilePanel}
        disabled={!currentDialogId}
      >
        Контекст
      </button>
    </div>
  );

  const renderDialogList = () => (
    <div className="dialogs-list">
      {loadingDialogs && <div className="state-line">Загружаем диалоги...</div>}
      {!loadingDialogs && dialogs.length === 0 && (
        <div className="empty-state">Диалогов пока нет</div>
      )}
      {dialogs.map((dialog) => (
        <button
          key={dialog.dialogId}
          type="button"
          className={`dialog-item ${
            currentDialogId === dialog.dialogId ? "active" : ""
          }`}
          onClick={() => selectDialog(dialog.dialogId)}
          onContextMenu={(event) => handleContextMenu(event, dialog.dialogId)}
        >
          <span className="dialog-title">{dialog.title}</span>
          <span className="dialog-meta">
            {new Date(dialog.createdAt).toLocaleDateString()}
          </span>
        </button>
      ))}
    </div>
  );

  const renderLeftSidebar = () => (
    <aside
      className={`dialogs-sidebar ${leftCollapsed ? "collapsed" : ""}`}
      style={{ width: leftCollapsed ? undefined : sidebarWidth }}
      aria-label="Диалоги"
    >
      <div className="sidebar-header">
        {!leftCollapsed && <h2>Диалоги</h2>}
        <button
          type="button"
          className="collapse-icon-btn"
          onClick={() => setLeftCollapsed((value) => !value)}
          aria-label={leftCollapsed ? "Развернуть левую панель" : "Свернуть левую панель"}
          title={leftCollapsed ? "Развернуть" : "Свернуть"}
        >
          {leftCollapsed ? "›" : "‹"}
        </button>
      </div>

      {!leftCollapsed && (
        <>
          {renderSidebarNavigation()}
          <button
            type="button"
            className="new-dialog-btn"
            onClick={() => setShowCreateDialog(true)}
          >
            Новый диалог
          </button>
          {renderDialogList()}
          <div className="account-block">
            <div className="avatar-circle">{userName?.charAt(0).toUpperCase() || "?"}</div>
            <div className="account-copy">
              <strong>{userName || "Пользователь"}</strong>
              <Link to="/dialogs">Аккаунт позже</Link>
            </div>
            <button type="button" className="text-btn" onClick={handleLogout}>
              Выйти
            </button>
          </div>
          <div
            className="sidebar-resize-handle"
            onMouseDown={startResize}
            role="separator"
            aria-orientation="vertical"
          />
        </>
      )}
    </aside>
  );

  const renderRightSidebar = () => (
    <aside
      className={`context-sidebar ${rightCollapsed ? "collapsed" : ""}`}
      aria-label="Контекст диалога"
    >
      <div className="context-header">
        {!rightCollapsed && <h2>Контекст</h2>}
        <button
          type="button"
          className="collapse-icon-btn"
          onClick={() => setRightCollapsed((value) => !value)}
          aria-label={rightCollapsed ? "Развернуть правую панель" : "Свернуть правую панель"}
          title={rightCollapsed ? "Развернуть" : "Свернуть"}
        >
          {rightCollapsed ? "‹" : "›"}
        </button>
      </div>

      {!rightCollapsed && (
        <div className="context-scroll">
          <section className="context-section">
            <div className="section-heading">
              <h3>Файлы</h3>
              <span>{currentFiles.length}</span>
            </div>
            {!currentDialogId && (
              <p className="muted-text">Выберите диалог, чтобы увидеть файлы.</p>
            )}
            {currentDialogId && loadingFiles && (
              <p className="muted-text">Загружаем файлы...</p>
            )}
            {currentDialogId && !loadingFiles && currentFiles.length === 0 && (
              <p className="muted-text">
                No files attached yet. Add learning materials so AI Tutor can use
                them in this dialog.
              </p>
            )}
            {currentFiles.length > 0 && (
              <ul className="file-list">
                {currentFiles.map((file) => (
                  <li key={file.fileId} className="file-item">
                    <span>{file.originalFileName}</span>
                    <small>ID {file.fileId}</small>
                  </li>
                ))}
              </ul>
            )}
            <label className="file-picker">
              {uploadFiles.length > 0
                ? `Выбрано файлов: ${uploadFiles.length}`
                : "Выбрать файлы"}
              <input
                type="file"
                onChange={(event) => handleFileSelect(event, "upload")}
                multiple
                disabled={!currentDialogId || uploading}
                accept=".txt,.docx,.pdf"
              />
            </label>
            <button
              type="button"
              className="primary-btn"
              onClick={handleUploadFilesToDialog}
              disabled={!currentDialogId || uploadFiles.length === 0 || uploading}
            >
              {uploading ? "Загружаем..." : "Добавить в диалог"}
            </button>
          </section>

          <section className="context-section">
            <div className="section-heading collapsible-heading">
              <h3>Подсказки</h3>
              <button
                type="button"
                className="section-toggle-btn"
                onClick={() => setSuggestionsCollapsed((value) => !value)}
                aria-label={
                  suggestionsCollapsed
                    ? "Развернуть подсказки"
                    : "Свернуть подсказки"
                }
                title={suggestionsCollapsed ? "Развернуть" : "Свернуть"}
              >
                {suggestionsCollapsed ? "⌄" : "⌃"}
              </button>
            </div>
            {!suggestionsCollapsed && (
              <div className="suggestion-list">
                {PROMPT_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="suggestion-btn"
                    onClick={() => insertPromptSuggestion(suggestion)}
                    disabled={!currentDialogId}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="context-section">
            <div className="section-heading">
              <h3>Тесты</h3>
              <span>{quizzes.length}</span>
            </div>
            <button
              type="button"
              className="primary-btn"
              onClick={() => setShowGenerateQuiz(true)}
              disabled={!currentDialogId || generatingQuiz}
            >
              Создать тест из диалога
            </button>
            {loadingQuizzes && <p className="muted-text">Загружаем тесты...</p>}
            {!loadingQuizzes && currentDialogId && quizzes.length === 0 && (
              <p className="muted-text">Созданных тестов пока нет.</p>
            )}
            {quizzes.length > 0 && (
              <div className="quiz-list">
                {quizzes.map((quiz) => (
                  <Link
                    key={quiz.id}
                    className="quiz-link"
                    to={`/dialogs/${currentDialogId}/tests/${quiz.id}`}
                  >
                    <span>{quiz.test_name}</span>
                    <small>{quiz.questions.length} вопросов</small>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </aside>
  );

  return (
    <div className="dialogs-page">
      {error && <div className="error-message">{error}</div>}

      <div
        className="dialogs-layout"
        style={{
          gridTemplateColumns: leftCollapsed
            ? "44px minmax(0, 1fr) auto"
            : `${sidebarWidth}px minmax(0, 1fr) auto`,
        }}
      >
        {renderLeftSidebar()}

        <main className="chat-area" aria-label="Чат">
          {currentDialogId ? (
            <>
              <div className="chat-header">
                {renderMobilePanelButtons()}
                <div>
                  <p>Текущий диалог</p>
                  <h2>{selectedDialog?.title || "Без названия"}</h2>
                </div>
                <button
                  type="button"
                  className="secondary-btn desktop-context-btn"
                  onClick={() => setRightCollapsed(false)}
                >
                  Контекст
                </button>
              </div>
              <div className="messages-container">
                {loadingMessages && (
                  <div className="state-line">Загружаем сообщения...</div>
                )}
                {!loadingMessages && messages.length === 0 && (
                  <div className="chat-empty">
                    <h3>Начните разговор</h3>
                    <p>
                      Задайте вопрос по загруженным материалам или вставьте
                      подсказку из правой панели.
                    </p>
                  </div>
                )}
                {messages.map((msg, index) => (
                  <article
                    key={`${msg.role}-${index}`}
                    className={`message ${
                      msg.role === "USER" ? "user-message" : "bot-message"
                    }`}
                  >
                    <div className="message-header">
                      {msg.role === "USER" ? "Вы" : "AI Tutor"}
                    </div>
                    <ReactMarkdown
                      className="message-markdown"
                      remarkPlugins={[remarkGfm, remarkBreaks]}
                      skipHtml={false}
                      components={{
                        a: ({ children, ...props }) => (
                          <a {...props} target="_blank" rel="noopener noreferrer">
                            {children}
                          </a>
                        ),
                        code({ inline, className, children, ...props }) {
                          const language =
                            /language-(\w+)/.exec(className || "")?.[1] || "";
                          if (inline) {
                            return (
                              <code className={`inline-code ${language}`} {...props}>
                                {children}
                              </code>
                            );
                          }
                          return (
                            <pre className={`code-block ${language}`}>
                              <code {...props}>{children}</code>
                            </pre>
                          );
                        },
                      }}
                    >
                      {msg.message}
                    </ReactMarkdown>
                  </article>
                ))}
              </div>

              <div className="message-input-wrapper">
                <textarea
                  placeholder="Напишите вопрос..."
                  value={inputText}
                  onChange={(event) => setInputText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={sending}
                  rows={2}
                />
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || sending}
                  className={inputText.trim() && !sending ? "active" : ""}
                >
                  {sending ? "..." : "Отправить"}
                </button>
              </div>
            </>
          ) : (
            <div className="no-dialog-selected">
              {renderMobilePanelButtons()}
              <h3>Выберите диалог</h3>
              <p>
                Создайте новый диалог с файлами, чтобы тьютор понимал контекст,
                и начните задавать вопросы.
              </p>
              <button
                type="button"
                className="primary-btn"
                onClick={() => setShowCreateDialog(true)}
              >
                Новый диалог
              </button>
            </div>
          )}
        </main>

        {renderRightSidebar()}
      </div>

      {leftMobileOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setLeftMobileOpen(false)}>
          <div className="mobile-drawer left" onClick={(event) => event.stopPropagation()}>
            <div className="mobile-drawer-header">
              <h2>Диалоги</h2>
              <button type="button" onClick={() => setLeftMobileOpen(false)}>
                Закрыть
              </button>
            </div>
            <button
              type="button"
              className="new-dialog-btn"
              onClick={() => setShowCreateDialog(true)}
            >
              Новый диалог
            </button>
            {renderSidebarNavigation()}
            {renderDialogList()}
          </div>
        </div>
      )}

      {rightMobileOpen && (
        <div
          className="mobile-drawer-overlay"
          onClick={() => setRightMobileOpen(false)}
        >
          <div
            className="mobile-drawer right"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mobile-drawer-header">
              <h2>Контекст</h2>
              <button type="button" onClick={() => setRightMobileOpen(false)}>
                Закрыть
              </button>
            </div>
            {renderRightSidebar()}
          </div>
        </div>
      )}

      {showCreateDialog && (
        <div className="modal-overlay" onClick={() => setShowCreateDialog(false)}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Создать диалог</h3>
              <button
                className="modal-close-btn"
                type="button"
                onClick={() => setShowCreateDialog(false)}
              >
                x
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-description">
                Загрузите файлы (TXT, DOCX, PDF), чтобы AI Tutor знал материалы,
                с которыми вы работаете.
              </p>
              <label className="file-picker large">
                {createFiles.length > 0
                  ? `Выбрано файлов: ${createFiles.length}`
                  : "Выбрать файлы"}
                <input
                  type="file"
                  onChange={(event) => handleFileSelect(event, "create")}
                  multiple
                  disabled={creatingDialog}
                  accept=".txt,.docx,.pdf"
                />
              </label>
              {createFiles.length > 0 && (
                <div className="selected-files-list">
                  {createFiles.map((file) => (
                    <div key={`${file.name}-${file.size}`} className="file-item">
                      <span>{file.name}</span>
                      <small>{Math.ceil(file.size / 1024)} KB</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="modal-cancel-btn"
                type="button"
                onClick={() => {
                  setShowCreateDialog(false);
                  setCreateFiles([]);
                }}
                disabled={creatingDialog}
              >
                Отмена
              </button>
              <button
                className="modal-submit-btn"
                type="button"
                onClick={handleCreateDialogWithFiles}
                disabled={creatingDialog || createFiles.length === 0}
              >
                {creatingDialog ? "Создаем..." : "Создать"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showGenerateQuiz && (
        <div className="modal-overlay" onClick={() => setShowGenerateQuiz(false)}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Создать тест</h3>
              <button
                className="modal-close-btn"
                type="button"
                onClick={() => setShowGenerateQuiz(false)}
              >
                x
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-description">
                Укажите количество вопросов для теста по текущему диалогу.
              </p>
              <label className="number-field">
                <span>Number of questions</span>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={questionsCount}
                  onChange={(event) => setQuestionsCount(Number(event.target.value))}
                  disabled={generatingQuiz}
                />
              </label>
            </div>
            <div className="modal-footer">
              <button
                className="modal-cancel-btn"
                type="button"
                onClick={() => setShowGenerateQuiz(false)}
                disabled={generatingQuiz}
              >
                Отмена
              </button>
              <button
                className="modal-submit-btn"
                type="button"
                onClick={handleGenerateQuiz}
                disabled={
                  generatingQuiz || questionsCount < 1 || questionsCount > 20
                }
              >
                {generatingQuiz ? "Generating test..." : "Создать"}
              </button>
            </div>
          </div>
        </div>
      )}

      {contextMenu.visible && (
        <div
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(event) => event.stopPropagation()}
        >
          <button type="button" className="context-menu-item" onClick={handleRenameDialog}>
            Переименовать
          </button>
          <button
            type="button"
            className="context-menu-item delete"
            onClick={handleDeleteFromContextMenu}
          >
            Удалить
          </button>
        </div>
      )}

      {showRenameModal && (
        <div className="modal-overlay" onClick={() => setShowRenameModal(false)}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Переименовать диалог</h3>
              <button
                className="modal-close-btn"
                type="button"
                onClick={() => setShowRenameModal(false)}
              >
                x
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-description">Введите новое название диалога.</p>
              <input
                type="text"
                className="modal-input-text"
                value={newDialogTitle}
                onChange={(event) => setNewDialogTitle(event.target.value)}
                placeholder="Новое название"
                maxLength={255}
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button
                className="modal-cancel-btn"
                type="button"
                onClick={() => setShowRenameModal(false)}
              >
                Отмена
              </button>
              <button
                className="modal-submit-btn"
                type="button"
                onClick={handleSubmitRename}
                disabled={!newDialogTitle.trim()}
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
