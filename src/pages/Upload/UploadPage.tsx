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
  const [currentFiles, setCurrentFiles] = useState<api.FileResponse[]>([]);
  const [fileCounts, setFileCounts] = useState<Record<number, number>>({});
  const [showFiles, setShowFiles] = useState(true);
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

  // Закрываем контекстное меню по клику вне его
  useEffect(() => {
    const handleClick = () =>
      setContextMenu({ visible: false, x: 0, y: 0, dialogId: null });
    if (contextMenu.visible) {
      window.addEventListener("click", handleClick);
      return () => window.removeEventListener("click", handleClick);
    }
  }, [contextMenu.visible]);

  useEffect(() => {
    loadDialogs();
  }, []);

  useEffect(() => {
    if (currentDialogId !== null) {
      loadMessages(currentDialogId);
      loadDialogFiles(currentDialogId);
      setShowFiles(true);
    }
  }, [currentDialogId]);

  const loadDialogs = async () => {
    try {
      const data = await api.getDialogs();
      setDialogs(data);
    } catch (err: any) {
      setError(err.message || "Не удалось загрузить список диалогов");
    }
  };

  const loadMessages = async (dialogId: number) => {
    try {
      const data = await api.getDialogMessages(dialogId);
      setMessages(data.dialogMessages);
    } catch (err: any) {
      setError(err.message || "Не удалось загрузить сообщения диалога");
    }
  };

  const loadDialogFiles = async (dialogId: number) => {
    try {
      const files = await api.getDialogFiles(dialogId);
      setCurrentFiles(files);
      setFileCounts((prev) => ({ ...prev, [dialogId]: files.length }));
    } catch (err: any) {
      setError(err.message || "Не удалось загрузить файлы диалога");
      setCurrentFiles([]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      const allowedExtensions = [".txt", ".docx", ".pdf"];

      const invalidFiles = fileArray.filter((file) => {
        const extension = "." + file.name.split(".").pop()?.toLowerCase();
        return !allowedExtensions.includes(extension);
      });

      if (invalidFiles.length > 0) {
        setError(
          `Можно загружать только TXT, DOCX, PDF. Проверьте файлы: ${invalidFiles
            .map((f) => f.name)
            .join(", ")}`
        );
        e.target.value = "";
        return;
      }

      setSelectedFiles(fileArray);
      setError(null);
    }
  };

  const handleCreateDialogWithFiles = async () => {
    if (selectedFiles.length === 0) {
      setError("Выберите файлы, чтобы создать диалог");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const dialog = await api.createDialogWithFiles(selectedFiles);
      setCurrentDialogId(dialog.dialogId);
      setSelectedFiles([]);
      setShowCreateDialog(false);
      await loadDialogs();
    } catch (err: any) {
      setError(err.message || "Не удалось создать диалог");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadFilesToDialog = async () => {
    if (!currentDialogId) {
      setError("Выберите диалог, чтобы загрузить файлы");
      return;
    }
    if (selectedFiles.length === 0) {
      setError("Добавьте файлы для загрузки");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.uploadFilesToDialog(currentDialogId, selectedFiles);
      setSelectedFiles([]);
      alert("Файлы загружены в диалог");
    } catch (err: any) {
      setError(err.message || "Не удалось загрузить файлы");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    if (!currentDialogId) {
      setError("Выберите диалог, чтобы отправлять сообщения");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.sendMessage(currentDialogId, inputText);
      setMessages([
        ...messages,
        { message: inputText, role: "USER" },
        { message: response.answer, role: "BOT" },
      ]);
      setInputText("");
    } catch (err: any) {
      setError(err.message || "Не удалось отправить сообщение");
    } finally {
      setLoading(false);
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
        setMessages([]);
      }
      await loadDialogs();
    } catch (err: any) {
      setError(err.message || "Не удалось удалить диалог");
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      onLogout();
      navigate("/auth");
    } catch (err: any) {
      setError(err.message || "Не удалось выйти из аккаунта");
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
      setError("Введите новое название диалога");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.changeDialogTitle(renameDialogId, newDialogTitle.trim());
      await loadDialogs();
      setShowRenameModal(false);
    } catch (err: any) {
      setError(err.message || "Не удалось переименовать диалог");
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
      <div className="upload-header"></div>

      {error && <div className="error-message">{error}</div>}

      <div className="upload-layout">
        <div className="dialogs-sidebar">
          <div className="sidebar-header">
            <h3>Ваши диалоги</h3>
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
                <div className="dialog-meta">
                  <span className="dialog-date">
                    {new Date(dialog.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
            {dialogs.length === 0 && (
              <div className="empty-state">Диалогов пока нет</div>
            )}
          </div>
        </div>

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
                  placeholder="Напишите вопрос..."
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
                    ? `Файлов выбрано: ${selectedFiles.length}`
                    : "Выбрать файлы"}
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

              <div className="dialog-files-panel">
                <div className="dialog-files-header">
                  <div className="dialog-files-title">
                    <h4>Файлы диалога</h4>
                    <span className="dialog-files-count">
                      {currentFiles.length} шт.
                    </span>
                  </div>
                  <button
                    type="button"
                    className="dialog-files-toggle"
                    onClick={() => setShowFiles((prev) => !prev)}
                  >
                    {showFiles ? "Свернуть" : "Развернуть"}
                  </button>
                </div>
                {showFiles && (
                  <>
                    {currentFiles.length > 0 ? (
                      <ul className="dialog-files-list">
                        {currentFiles.map((file) => (
                          <li key={file.fileId} className="dialog-file-item">
                            {file.originalFileName}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="dialog-files-empty">Файлы не загружены</p>
                    )}
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="no-dialog-selected">
              <h3>Выберите диалог</h3>
              <p>
                Создайте новый диалог с файлами, чтобы тьютор понимал контекст,
                и начните задавать вопросы.
              </p>
            </div>
          )}
        </div>
      </div>

      {showCreateDialog && (
        <div className="modal-overlay" onClick={() => setShowCreateDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Создать диалог</h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowCreateDialog(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-description">
                Загрузите файлы (TXT, DOCX, PDF), чтобы AITutor знал материалы,
                с которыми вы работаете.
              </p>
              <p className="modal-warning">
                Можно прикреплять несколько файлов сразу.
              </p>
              <label className="file-input-label-modal">
                {selectedFiles.length > 0
                  ? `Файлов выбрано: ${selectedFiles.length}`
                  : "Выбрать файлы"}
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
                      • {file.name}
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
                {loading ? "Создаём..." : "Создать"}
              </button>
            </div>
          </div>
        </div>
      )}

      {contextMenu.visible && (
        <div
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="context-menu-item" onClick={handleRenameDialog}>
            Переименовать
          </div>
          <div className="context-menu-item delete" onClick={handleDeleteFromContextMenu}>
            Удалить
          </div>
        </div>
      )}

      {showRenameModal && (
        <div className="modal-overlay" onClick={() => setShowRenameModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Переименовать диалог</h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowRenameModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-description">
                Введите новое название диалога.
              </p>
              <input
                type="text"
                className="modal-input-text"
                value={newDialogTitle}
                onChange={(e) => setNewDialogTitle(e.target.value)}
                placeholder="Новое название"
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
                {loading ? "Сохраняем..." : "Сохранить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
