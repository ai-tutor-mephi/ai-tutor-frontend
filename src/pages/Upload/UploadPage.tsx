import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as api from "../../services/api";
import "./UploadPage.css";

type Props = { onLogout: () => void };

export const UploadPage: React.FC<Props> = ({ onLogout }) => {
  const navigate = useNavigate();
  const [dialogs, setDialogs] = useState<api.DialogInfo[]>([]);
  const [currentDialogId, setCurrentDialogId] = useState<number | null>(null);
  const [messages, setMessages] = useState<api.DialogMessagesDto[]>([]);
  const [inputText, setInputText] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    dialogId: number | null;
  }>({ visible: false, x: 0, y: 0, dialogId: null });
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameDialogId, setRenameDialogId] = useState<number | null>(null);
  const [newDialogTitle, setNewDialogTitle] = useState("");

  // Закрытие контекстного меню при клике вне его
  useEffect(() => {
    const handleClick = () => setContextMenu({ visible: false, x: 0, y: 0, dialogId: null });
    if (contextMenu.visible) {
      window.addEventListener("click", handleClick);
      return () => window.removeEventListener("click", handleClick);
    }
  }, [contextMenu.visible]);

  // Загрузить список диалогов при монтировании
  useEffect(() => {
    loadDialogs();
    // ВРЕМЕННЫЕ МОК-ДАННЫЕ для тестирования UI
    if (dialogs.length === 0) {
      setDialogs([
        {
          dialogId: 1,
          title: "Математический анализ - лекция 5",
          createdAt: new Date().toISOString(),
        },
        {
          dialogId: 2,
          title: "Физика - задачи по механике",
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          dialogId: 3,
          title: "История России - конспект",
          createdAt: new Date(Date.now() - 172800000).toISOString(),
        },
      ]);
    }
  }, []);

  // Загрузить сообщения при выборе диалога
  useEffect(() => {
    if (currentDialogId !== null) {
      loadMessages(currentDialogId);
    }
  }, [currentDialogId]);

  const loadDialogs = async () => {
    try {
      const data = await api.getDialogs();
      setDialogs(data);
    } catch (err: any) {
      setError(err.message || "Ошибка загрузки диалогов");
    }
  };

  const loadMessages = async (dialogId: number) => {
    try {
      const data = await api.getDialogMessages(dialogId);
      setMessages(data.dialogMessages);
    } catch (err: any) {
      setError(err.message || "Ошибка загрузки сообщений");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      const allowedExtensions = ['.txt', '.docx', '.pdf'];
      
      // Проверяем, что все файлы имеют разрешенные расширения
      const invalidFiles = fileArray.filter(file => {
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();
        return !allowedExtensions.includes(extension);
      });
      
      if (invalidFiles.length > 0) {
        setError(`Можно загружать только файлы форматов: TXT, DOCX, PDF. Неподдерживаемые файлы: ${invalidFiles.map(f => f.name).join(', ')}`);
        e.target.value = ''; // Очищаем input
        return;
      }
      
      setSelectedFiles(fileArray);
      setError(null);
    }
  };

  const handleCreateDialogWithFiles = async () => {
    if (selectedFiles.length === 0) {
      setError("Выберите хотя бы один файл");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const dialog = await api.createDialogWithFiles(selectedFiles);
      setCurrentDialogId(dialog.dialogId);
      setSelectedFiles([]);
      setShowCreateDialog(false); // Закрываем модальное окно
      await loadDialogs();
    } catch (err: any) {
      setError(err.message || "Ошибка создания диалога");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadFilesToDialog = async () => {
    if (!currentDialogId) {
      setError("Сначала выберите диалог");
      return;
    }
    if (selectedFiles.length === 0) {
      setError("Выберите файлы для загрузки");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.uploadFilesToDialog(currentDialogId, selectedFiles);
      setSelectedFiles([]);
      alert("Файлы успешно загружены в диалог");
    } catch (err: any) {
      setError(err.message || "Ошибка загрузки файлов");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    if (!currentDialogId) {
      setError("Сначала создайте или выберите диалог");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.sendMessage(currentDialogId, inputText);
      
      // Добавляем сообщение пользователя и ответ бота
      setMessages([
        ...messages,
        { message: inputText, role: "USER" },
        { message: response.answer, role: "BOT" },
      ]);
      
      setInputText("");
    } catch (err: any) {
      setError(err.message || "Ошибка отправки сообщения");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDialog = async (dialogId: number) => {
    if (!window.confirm("Вы уверены, что хотите удалить этот диалог?")) {
      return;
    }

    try {
      await api.deleteDialog(dialogId);
      if (currentDialogId === dialogId) {
        setCurrentDialogId(null);
        setMessages([]);
      }
      await loadDialogs();
    } catch (err: any) {
      setError(err.message || "Ошибка удаления диалога");
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      onLogout();
      navigate("/auth");
    } catch (err: any) {
      setError(err.message || "Ошибка выхода");
    }
  };

  const handleContextMenu = (e: React.MouseEvent, dialogId: number) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      dialogId,
    });
  };

  const handleRenameDialog = () => {
    if (contextMenu.dialogId !== null) {
      const dialog = dialogs.find((d) => d.dialogId === contextMenu.dialogId);
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
      setError("Название не может быть пустым");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.changeDialogTitle(renameDialogId, newDialogTitle.trim());
      // Обновляем список диалогов
      await loadDialogs();
      setShowRenameModal(false);
    } catch (err: any) {
      setError(err.message || "Ошибка переименования диалога");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFromContextMenu = () => {
    if (contextMenu.dialogId !== null) {
      handleDeleteDialog(contextMenu.dialogId);
    }
    setContextMenu({ visible: false, x: 0, y: 0, dialogId: null });
  };

  return (
    <div className="upload-page">
      <div className="upload-header">
        <h2>Диалоги</h2>
        <button onClick={handleLogout} className="logout-button">
          Выйти
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="upload-layout">
        {/* Боковая панель со списком диалогов */}
        <div className="dialogs-sidebar">
          <div className="sidebar-header">
            <h3>Мои диалоги</h3>
            <button
              className="new-dialog-btn"
              onClick={() => setShowCreateDialog(true)}
            >
              + Новый диалог
            </button>
          </div>
          <div className="dialogs-list">
            {dialogs.map((dialog) => (
              <div
                key={dialog.dialogId}
                className={`dialog-item ${
                  currentDialogId === dialog.dialogId ? "active" : ""
                }`}
                onClick={() => setCurrentDialogId(dialog.dialogId)}
                onContextMenu={(e) => handleContextMenu(e, dialog.dialogId)}
              >
                <div className="dialog-title">{dialog.title}</div>
                <div className="dialog-date">
                  {new Date(dialog.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Основная область с сообщениями */}
        <div className="chat-area">
          {currentDialogId ? (
            <>
              <div className="messages-container">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`message ${
                      msg.role === "USER" ? "user-message" : "bot-message"
                    }`}
                  >
                    <strong>{msg.role === "USER" ? "Вы" : "AITutor"}:</strong>{" "}
                    {msg.message}
                  </div>
                ))}
              </div>

              <div className="message-input-wrapper">
                <input
                  type="text"
                  placeholder="Введите сообщение..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || loading}
                  className={inputText.trim() && !loading ? "active" : ""}
                >
                  {loading ? "..." : "Отправить"}
                </button>
              </div>

              <div className="upload-files-section">
                <label className="file-input-label">
                  {selectedFiles.length > 0
                    ? `Выбрано файлов: ${selectedFiles.length}`
                    : "Выберите файлы"}
                  <input
                    type="file"
                    className="file-input"
                    onChange={handleFileSelect}
                    multiple
                    disabled={loading}
                    accept=".txt,.docx,.pdf"
                  />
                </label>
                {selectedFiles.length > 0 && (
                  <button
                    onClick={handleUploadFilesToDialog}
                    disabled={loading}
                    className="upload-btn"
                  >
                    Загрузить в диалог
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="no-dialog-selected">
              <h3>Выберите диалог из списка или создайте новый</h3>
              <p>Для создания нового диалога нажмите кнопку "+ Новый диалог"</p>
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно для создания нового диалога */}
      {showCreateDialog && (
        <div className="modal-overlay" onClick={() => setShowCreateDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Создать новый диалог</h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowCreateDialog(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-description">
                Выберите файлы для создания нового диалога с AI-тьютором
              </p>
              <p className="modal-warning">
                ⚠️ Поддерживаются только форматы: <strong>TXT, DOCX, PDF</strong>
              </p>
              <label className="file-input-label-modal">
                {selectedFiles.length > 0
                  ? `Выбрано файлов: ${selectedFiles.length}`
                  : "📁 Выберите файлы"}
                <input
                  type="file"
                  className="file-input"
                  onChange={handleFileSelect}
                  multiple
                  disabled={loading}
                  accept=".txt,.docx,.pdf"
                />
              </label>
              {selectedFiles.length > 0 && (
                <div className="selected-files-list">
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} className="file-item">
                      📄 {file.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="modal-cancel-btn"
                onClick={() => {
                  setShowCreateDialog(false);
                  setSelectedFiles([]);
                }}
                disabled={loading}
              >
                Отмена
              </button>
              <button
                className="modal-create-btn"
                onClick={handleCreateDialogWithFiles}
                disabled={loading || selectedFiles.length === 0}
              >
                {loading ? "Создание..." : "Создать"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Контекстное меню для диалога */}
      {contextMenu.visible && (
        <div
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="context-menu-item" onClick={handleRenameDialog}>
            ✏️ Переименовать
          </div>
          <div className="context-menu-item delete" onClick={handleDeleteFromContextMenu}>
            🗑️ Удалить
          </div>
        </div>
      )}

      {/* Модальное окно переименования диалога */}
      {showRenameModal && (
        <div className="modal-overlay" onClick={() => setShowRenameModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Переименовать диалог</h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowRenameModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-description">
                Введите новое название диалога
              </p>
              <input
                type="text"
                className="modal-input-text"
                value={newDialogTitle}
                onChange={(e) => setNewDialogTitle(e.target.value)}
                placeholder="Название диалога"
                maxLength={255}
                disabled={loading}
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button
                className="modal-cancel-btn"
                onClick={() => setShowRenameModal(false)}
                disabled={loading}
              >
                Отмена
              </button>
              <button
                className="modal-submit-btn"
                onClick={handleSubmitRename}
                disabled={loading || !newDialogTitle.trim()}
              >
                {loading ? "Сохранение..." : "Сохранить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
