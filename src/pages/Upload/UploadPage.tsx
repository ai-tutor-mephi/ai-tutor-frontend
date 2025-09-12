import React, { useState } from "react";
import * as api from "../../services/api";
import "./UploadPage.css";

type Props = { onLogout: () => void };

export const UploadPage: React.FC<Props> = () => {
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [inputText, setInputText] = useState<string>("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    try {
      const res = await api.uploadFile(selectedFile);
      setMessage(`Файл загружен: ${res.filename}`);
    } catch (err: any) {
      setMessage(err.message || "Ошибка загрузки файла");
    }
  };

  const handleLinkAttach = () => {
    if (!link.trim()) return;
    setMessage(`Ссылка прикреплена: ${link}`);
    setLink("");
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    setMessage(`Отправлено сообщение: ${inputText}`);
    setInputText("");
  };

  return (
    <div className="upload-page">
      <div className="upload-blocks">
        <div className="upload-block">
          <span className="block-title">Загрузка файла</span>
          <label className="file-input-label">
            {file ? file.name : "Выберите файл"}
            <input type="file" className="file-input" onChange={handleFileUpload} />
          </label>
        </div>

        <div className="upload-block">
          <span className="block-title">Прикрепить ссылку</span>
          <input
            type="text"
            placeholder="Вставьте ссылку..."
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="link-input"
          />
          <button
            type="button"
            onClick={handleLinkAttach}
            disabled={!link.trim()}
            className={link.trim() ? "active" : ""}
          >
            Прикрепить
          </button>
        </div>
      </div>

      <div className="message-input-wrapper">
        <input
          type="text"
          placeholder="Введите сообщение чтобы начать диалог..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <button
          type="button"
          onClick={handleSendMessage}
          disabled={!inputText.trim()}
          className={inputText.trim() ? "active" : ""}
        >
          Отправить
        </button>
      </div>

      {message && <div className="status-message">{message}</div>}
    </div>
  );
};
