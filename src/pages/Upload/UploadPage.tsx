import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import * as api from "../../services/api";
import ErrorToast from "../../components/ErrorToast";
import logo from "../../assets/AI_Tutor_LOGO.PNG";
import "./UploadPage.css";

type Props = { onLogout: () => void };

type ChatMessage = api.DialogMessagesDto & {
  localId: string;
  status: "sent" | "pending" | "error";
  retryQuestion?: string;
};

const MIN_SIDEBAR_WIDTH = 160;
const MAX_SIDEBAR_WIDTH = 620;
const MIN_RIGHT_SIDEBAR_WIDTH = 200;
const MAX_RIGHT_SIDEBAR_WIDTH = 690;
const COLLAPSED_SIDEBAR_WIDTH = 44;
const MIN_CHAT_AREA_WIDTH = 320;
const LAYOUT_HORIZONTAL_PADDING = 16;
const ASSISTANT_PENDING_TEXT = "AI Tutor готовит ответ...";
const ASSISTANT_ERROR_TEXT = "Не удалось получить ответ. Попробуйте повторить запрос.";

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
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(300);
  const messageIdRef = useRef(0);
  const activeDialogIdRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [dialogs, setDialogs] = useState<api.DialogInfo[]>([]);
  const [currentDialogId, setCurrentDialogId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentFiles, setCurrentFiles] = useState<api.FileResponse[]>([]);
  const [quizzes, setQuizzes] = useState<api.QuizResponse[]>([]);
  const [inputText, setInputText] = useState("");
  const [createDialogTitle, setCreateDialogTitle] = useState("");
  const [createFiles, setCreateFiles] = useState<File[]>([]);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(340);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [filesCollapsed, setFilesCollapsed] = useState(false);
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
  const [accountName, setAccountName] = useState(
    () => api.getUserNameFromToken() || ""
  );
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [accountEditing, setAccountEditing] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");
  const [savingAccountName, setSavingAccountName] = useState(false);

  const displayUserName = accountName || "Пользователь";
  const accountInitial = displayUserName.charAt(0).toUpperCase();
  const selectedDialog = useMemo(
    () => dialogs.find((dialog) => dialog.dialogId === currentDialogId) || null,
    [dialogs, currentDialogId]
  );

  useEffect(() => {
    loadDialogs();
  }, []);

  useEffect(() => {
    activeDialogIdRef.current = currentDialogId;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDialogId]);

  useEffect(() => {
    const handleClick = () =>
      setContextMenu({ visible: false, x: 0, y: 0, dialogId: null });
    if (contextMenu.visible) {
      window.addEventListener("click", handleClick);
      return () => window.removeEventListener("click", handleClick);
    }
  }, [contextMenu.visible]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: loadingMessages ? "auto" : "smooth",
      block: "end",
    });
  }, [messages, loadingMessages, currentDialogId]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLeftMobileOpen(false);
        setRightMobileOpen(false);
      }
    };

    if (leftMobileOpen || rightMobileOpen) {
      window.addEventListener("keydown", handleEscape);
      return () => window.removeEventListener("keydown", handleEscape);
    }
  }, [leftMobileOpen, rightMobileOpen]);

  useEffect(() => {
    const syncAccountName = () => {
      setAccountName(api.getUserNameFromToken() || "");
    };

    window.addEventListener(api.AUTH_STATE_CHANGED_EVENT, syncAccountName);
    return () =>
      window.removeEventListener(api.AUTH_STATE_CHANGED_EVENT, syncAccountName);
  }, []);

  useEffect(() => {
    if (!accountMenuOpen) return;

    const closeMenu = () => {
      setAccountMenuOpen(false);
      setAccountEditing(false);
      setNewAccountName("");
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };

    window.addEventListener("click", closeMenu);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("click", closeMenu);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [accountMenuOpen]);

  const loadDialogs = async () => {
    setLoadingDialogs(true);
    try {
      const data = await api.getDialogs();
      setDialogs(data);
    } catch (err: any) {
      setError(api.getErrorMessage(err));
    } finally {
      setLoadingDialogs(false);
    }
  };

  const loadMessages = async (dialogId: number) => {
    setLoadingMessages(true);
    try {
      const data = await api.getDialogMessages(dialogId);
      setMessages(
        data.dialogMessages.map((message) => ({
          ...message,
          localId: nextLocalMessageId(),
          status: "sent",
        }))
      );
    } catch (err: any) {
      setError(api.getErrorMessage(err));
    } finally {
      setLoadingMessages(false);
    }
  };

  function nextLocalMessageId() {
    messageIdRef.current += 1;
    return `message-${messageIdRef.current}`;
  }

  const loadDialogFiles = async (dialogId: number) => {
    setLoadingFiles(true);
    try {
      const files = await api.getDialogFiles(dialogId);
      setCurrentFiles(files);
    } catch (err: any) {
      setError(api.getErrorMessage(err));
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
      setError(api.getErrorMessage(err));
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
    if (creatingDialog) return;

    if (createFiles.length === 0) {
      setError("Выберите файлы, чтобы создать диалог");
      return;
    }

    setCreatingDialog(true);
    setError(null);

    try {
      const dialog = await api.createDialogWithFiles(
        createFiles,
        createDialogTitle.trim()
      );
      setCurrentDialogId(dialog.dialogId);
      setCreateFiles([]);
      setCreateDialogTitle("");
      setShowCreateDialog(false);
      await loadDialogs();
    } catch (err: any) {
      setError(api.getErrorMessage(err));
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
      setError(api.getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const submitQuestion = async (
    dialogId: number,
    question: string,
    assistantMessageId: string
  ) => {
    setSending(true);
    setError(null);

    try {
      const response = await api.sendMessage(dialogId, question);
      if (activeDialogIdRef.current !== dialogId) return;

      setMessages((prev) =>
        prev.map((message) =>
          message.localId === assistantMessageId
            ? { ...message, message: response.answer, status: "sent" }
            : message
        )
      );
    } catch (err: any) {
      if (activeDialogIdRef.current !== dialogId) return;

      setError(api.getErrorMessage(err));
      setMessages((prev) =>
        prev.map((message) =>
          message.localId === assistantMessageId
            ? {
                ...message,
                message: ASSISTANT_ERROR_TEXT,
                status: "error",
                retryQuestion: question,
              }
            : message
        )
      );
    } finally {
      setSending(false);
    }
  };

  const handleSendMessage = () => {
    const question = inputText.trim();
    if (!question || sending) return;

    const dialogId = currentDialogId;
    if (!dialogId) {
      setError("Выберите диалог, чтобы отправлять сообщения");
      return;
    }

    setError(null);
    setInputText("");

    const userMessage: ChatMessage = {
      localId: nextLocalMessageId(),
      message: question,
      role: "USER",
      status: "sent",
    };
    const assistantMessage: ChatMessage = {
      localId: nextLocalMessageId(),
      message: ASSISTANT_PENDING_TEXT,
      role: "BOT",
      status: "pending",
      retryQuestion: question,
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    submitQuestion(dialogId, question, assistantMessage.localId);
  };

  const retryAssistantMessage = (message: ChatMessage) => {
    if (!currentDialogId || !message.retryQuestion || sending) return;

    setMessages((prev) =>
      prev.map((item) =>
        item.localId === message.localId
          ? { ...item, message: ASSISTANT_PENDING_TEXT, status: "pending" }
          : item
      )
    );
    submitQuestion(currentDialogId, message.retryQuestion, message.localId);
  };

  const handleGenerateQuiz = async () => {
    if (generatingQuiz) return;

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
      setError(api.getErrorMessage(err));
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
      setError(api.getErrorMessage(err));
    }
  };

  const handleLogout = async () => {
    setAccountMenuOpen(false);
    setAccountEditing(false);
    try {
      await api.logout();
    } catch {
      api.clearTokens();
    }
    onLogout();
    navigate("/auth");
  };

  const handleStartAccountRename = () => {
    setNewAccountName(accountName);
    setAccountEditing(true);
  };

  const handleSubmitAccountRename = async () => {
    const nextName = newAccountName.trim();
    if (nextName.length < 3) {
      setError("Имя должно быть длиной от 3 символов");
      return;
    }

    setSavingAccountName(true);
    setError(null);

    try {
      const response = await api.changeUsername(nextName);
      await api.refreshTokens();
      setAccountName(response.userName || nextName);
      setAccountMenuOpen(false);
      setAccountEditing(false);
      setNewAccountName("");
    } catch (err: any) {
      setError(api.getErrorMessage(err));
    } finally {
      setSavingAccountName(false);
    }
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
      setError(api.getErrorMessage(err));
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
      const rightWidth = rightCollapsed
        ? COLLAPSED_SIDEBAR_WIDTH
        : rightSidebarWidth;
      const availableMaxWidth =
        window.innerWidth -
        LAYOUT_HORIZONTAL_PADDING -
        rightWidth -
        MIN_CHAT_AREA_WIDTH;
      const maxWidth = Math.min(MAX_SIDEBAR_WIDTH, availableMaxWidth);
      const nextWidth =
        resizeStartWidth.current + moveEvent.clientX - resizeStartX.current;
      setSidebarWidth(
        Math.max(
          MIN_SIDEBAR_WIDTH,
          Math.min(Math.max(MIN_SIDEBAR_WIDTH, maxWidth), nextWidth)
        )
      );
    };

    const handleUp = () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  };

  const startRightResize = (event: React.MouseEvent<HTMLDivElement>) => {
    resizeStartX.current = event.clientX;
    resizeStartWidth.current = rightSidebarWidth;

    const handleMove = (moveEvent: MouseEvent) => {
      const leftWidth = leftCollapsed ? COLLAPSED_SIDEBAR_WIDTH : sidebarWidth;
      const availableMaxWidth =
        window.innerWidth -
        LAYOUT_HORIZONTAL_PADDING -
        leftWidth -
        MIN_CHAT_AREA_WIDTH;
      const maxWidth = Math.min(MAX_RIGHT_SIDEBAR_WIDTH, availableMaxWidth);
      const nextWidth =
        resizeStartWidth.current + resizeStartX.current - moveEvent.clientX;
      setRightSidebarWidth(
        Math.max(
          MIN_RIGHT_SIDEBAR_WIDTH,
          Math.min(Math.max(MIN_RIGHT_SIDEBAR_WIDTH, maxWidth), nextWidth)
        )
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

  const openLeftMobilePanel = () => {
    setRightMobileOpen(false);
    setLeftMobileOpen(true);
  };

  const openRightMobilePanel = () => {
    setLeftMobileOpen(false);
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
        Материалы
      </button>
    </div>
  );

  const renderMobileTopBar = () => (
    <div className="mobile-dialogs-topbar">
      <button
        type="button"
        className="mobile-icon-btn"
        onClick={openLeftMobilePanel}
        aria-label="Диалоги"
        title="Диалоги"
      >
        ☰
      </button>
      <div className="mobile-dialog-title">
        {selectedDialog?.title || "Выберите диалог"}
      </div>
      <button
        type="button"
        className="mobile-icon-btn"
        onClick={openRightMobilePanel}
        disabled={!currentDialogId}
        aria-label="Материалы"
        title="Материалы"
      >
        ◧
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

  const renderAccountBlock = (extraClassName = "") => (
    <div
      className={`account-block ${extraClassName}`}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className="account-trigger"
        onClick={() => {
          setAccountMenuOpen((value) => !value);
          setAccountEditing(false);
          setNewAccountName("");
        }}
        aria-haspopup="menu"
        aria-expanded={accountMenuOpen}
      >
        <span className="avatar-circle">{accountInitial}</span>
        <span className="account-copy">
          <strong>{displayUserName}</strong>
        </span>
      </button>

      {accountMenuOpen && (
        <div className="account-menu" role="menu">
          {!accountEditing ? (
            <>
              <button
                type="button"
                className="context-menu-item account-menu-item"
                onClick={handleStartAccountRename}
                role="menuitem"
              >
                Изменить имя
              </button>
              <button
                type="button"
                className="context-menu-item account-menu-item delete"
                onClick={handleLogout}
                role="menuitem"
              >
                Выйти
              </button>
            </>
          ) : (
            <div className="account-name-form">
              <label>
                <span>Новое имя</span>
                <input
                  type="text"
                  value={newAccountName}
                  onChange={(event) => setNewAccountName(event.target.value)}
                  minLength={3}
                  maxLength={50}
                  disabled={savingAccountName}
                  autoFocus
                />
              </label>
              <div className="account-menu-actions">
                <button
                  type="button"
                  onClick={() => {
                    setAccountEditing(false);
                    setNewAccountName("");
                  }}
                  disabled={savingAccountName}
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleSubmitAccountRename}
                  disabled={savingAccountName || newAccountName.trim().length < 3}
                >
                  {savingAccountName ? "Сохраняем..." : "Сохранить"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderLeftSidebar = () => (
    <aside
      className={`dialogs-sidebar ${leftCollapsed ? "collapsed" : ""}`}
      style={{ width: leftCollapsed ? undefined : sidebarWidth }}
      aria-label="Диалоги"
    >
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <img src={logo} alt="Логотип AI Tutor" className="sidebar-brand-logo" />
          {!leftCollapsed && <span>AI Tutor</span>}
        </div>
        <button
          type="button"
          className="sidebar-toggle-btn"
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
          <div className="sidebar-section-label">Диалоги</div>
          {renderDialogList()}
          {renderAccountBlock()}
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
      style={{ width: rightCollapsed ? undefined : rightSidebarWidth }}
      aria-label="Материалы диалога"
    >
      {!rightCollapsed && (
        <div
          className="right-sidebar-resize-handle"
          onMouseDown={startRightResize}
          role="separator"
          aria-orientation="vertical"
        />
      )}
      <div className="context-header">
        {!rightCollapsed && <h2>Материалы</h2>}
        <button
          type="button"
          className="sidebar-toggle-btn"
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
            <div className="section-heading collapsible-heading">
              <h3>Файлы</h3>
              <div className="section-heading-actions">
                <span>{currentFiles.length}</span>
                <button
                  type="button"
                  className="section-toggle-btn"
                  onClick={() => setFilesCollapsed((value) => !value)}
                  aria-label={filesCollapsed ? "Развернуть файлы" : "Свернуть файлы"}
                  title={filesCollapsed ? "Развернуть" : "Свернуть"}
                >
                  {filesCollapsed ? "⌄" : "⌃"}
                </button>
              </div>
            </div>
            {!filesCollapsed && (
              <>
                {!currentDialogId && (
                  <p className="muted-text">Выберите диалог, чтобы увидеть файлы.</p>
                )}
                {currentDialogId && loadingFiles && (
                  <p className="muted-text">Загружаем файлы...</p>
                )}
                {currentDialogId && !loadingFiles && currentFiles.length === 0 && (
                  <p className="muted-text">
                    Файлы пока не прикреплены. Добавьте материалы, чтобы AI Tutor
                    использовал их в этом диалоге.
                  </p>
                )}
                {currentFiles.length > 0 && (
                  <ul className="file-list">
                    {currentFiles.map((file) => (
                      <li key={file.fileId} className="file-item">
                        <span>{file.originalFileName}</span>
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
              </>
            )}
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
              Создать тест по диалогу
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

  const renderMobileAccountBlock = () =>
    renderAccountBlock("mobile-account-block");

  return (
    <div className="dialogs-page">
      <ErrorToast message={error} onDismiss={() => setError(null)} />

      <div
        className="dialogs-layout"
        style={{
          gridTemplateColumns: leftCollapsed
            ? `${COLLAPSED_SIDEBAR_WIDTH}px minmax(0, 1fr) auto`
            : `${sidebarWidth}px minmax(0, 1fr) auto`,
        }}
      >
        {renderLeftSidebar()}

        <main className="chat-area" aria-label="Чат">
          {renderMobileTopBar()}
          {currentDialogId ? (
            <>
              <div className="chat-header">
                {renderMobilePanelButtons()}
                <div>
                  <p>Текущий диалог</p>
                  <h2>{selectedDialog?.title || "Без названия"}</h2>
                </div>
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
                {messages.map((msg) => (
                  <article
                    key={msg.localId}
                    className={`message ${
                      msg.role === "USER" ? "user-message" : "bot-message"
                    } ${msg.status === "pending" ? "pending-message" : ""} ${
                      msg.status === "error" ? "error-message-inline" : ""
                    }`}
                  >
                    <div className="message-header">
                      {msg.role === "USER" ? "Вы" : "AI Tutor"}
                    </div>
                    {msg.status === "pending" ? (
                      <div className="typing-message" aria-live="polite">
                        <span>{ASSISTANT_PENDING_TEXT}</span>
                        <span className="typing-dots" aria-hidden="true">
                          <span />
                          <span />
                          <span />
                        </span>
                      </div>
                    ) : (
                      <>
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
                        {msg.status === "error" && msg.retryQuestion && (
                          <button
                            type="button"
                            className="retry-message-btn"
                            onClick={() => retryAssistantMessage(msg)}
                            disabled={sending}
                          >
                            Повторить
                          </button>
                        )}
                      </>
                    )}
                  </article>
                ))}
                <div ref={messagesEndRef} aria-hidden="true" />
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
              <h3>Выберите диалог</h3>
              <p>
                Откройте существующий диалог в левой боковой панели или создайте
                новый.
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
              <div className="sidebar-brand">
                <img src={logo} alt="Логотип AI Tutor" className="sidebar-brand-logo" />
                <span>AI Tutor</span>
              </div>
              <button
                type="button"
                className="mobile-drawer-close-btn"
                onClick={() => setLeftMobileOpen(false)}
                aria-label="Закрыть"
                title="Закрыть"
              >
                ×
              </button>
            </div>
            {renderSidebarNavigation()}
            <button
              type="button"
              className="new-dialog-btn"
              onClick={() => {
                setLeftMobileOpen(false);
                setShowCreateDialog(true);
              }}
            >
              Новый диалог
            </button>
            {renderDialogList()}
            {renderMobileAccountBlock()}
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
              <h2>Материалы</h2>
              <button
                type="button"
                className="mobile-drawer-close-btn"
                onClick={() => setRightMobileOpen(false)}
                aria-label="Закрыть"
                title="Закрыть"
              >
                ×
              </button>
            </div>
            {renderRightSidebar()}
          </div>
        </div>
      )}

      {showCreateDialog && (
        <div
          className="modal-overlay"
          onClick={() => {
            if (!creatingDialog) setShowCreateDialog(false);
          }}
        >
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Создать диалог</h3>
              <button
                className="modal-close-btn"
                type="button"
                onClick={() => setShowCreateDialog(false)}
                disabled={creatingDialog}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-description">
                Загрузите файлы (TXT, DOCX, PDF), чтобы AI Tutor знал материалы,
                с которыми вы работаете.
              </p>
              <label className="modal-field">
                <span>Название диалога</span>
                <input
                  type="text"
                  className="modal-input-text"
                  value={createDialogTitle}
                  onChange={(event) => setCreateDialogTitle(event.target.value)}
                  placeholder="Например: Лекция по SQL"
                  maxLength={255}
                  disabled={creatingDialog}
                />
                <small>Можно оставить пустым</small>
              </label>
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
              {creatingDialog && (
                <div className="modal-loading-state" role="status" aria-live="polite">
                  <span className="loading-dots" aria-hidden="true">
                    <span></span>
                    <span></span>
                    <span></span>
                  </span>
                  <div>
                    <strong>Создаём диалог...</strong>
                    <small>Это может занять некоторое время</small>
                  </div>
                </div>
              )}
              {createFiles.length > 0 && (
                <div className="selected-files-list">
                  {createFiles.map((file) => (
                    <div key={`${file.name}-${file.size}`} className="file-item">
                      <span>{file.name}</span>
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
                  setCreateDialogTitle("");
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
                {creatingDialog ? "Создаём..." : "Создать"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showGenerateQuiz && (
        <div
          className="modal-overlay"
          onClick={() => {
            if (!generatingQuiz) setShowGenerateQuiz(false);
          }}
        >
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Создать тест</h3>
              <button
                className="modal-close-btn"
                type="button"
                onClick={() => setShowGenerateQuiz(false)}
                disabled={generatingQuiz}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-description">
                Укажите количество вопросов для теста по текущему диалогу.
              </p>
              <label className="number-field">
                <span>Количество вопросов</span>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={questionsCount}
                  onChange={(event) => setQuestionsCount(Number(event.target.value))}
                  disabled={generatingQuiz}
                />
              </label>
              {generatingQuiz && (
                <div className="modal-loading-state" role="status" aria-live="polite">
                  <span className="loading-dots" aria-hidden="true">
                    <span></span>
                    <span></span>
                    <span></span>
                  </span>
                  <div>
                    <strong>Создаём тест...</strong>
                    <small>Это может занять некоторое время</small>
                  </div>
                </div>
              )}
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
                {generatingQuiz ? "Создаём..." : "Сгенерировать"}
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
                ×
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
