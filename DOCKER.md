# 🐳 Docker Guide для AI Tutor Frontend

## Структура файлов

```
ai-tutor-frontend/
├── Dockerfile              # Production образ
├── Dockerfile.dev          # Development образ
├── docker-compose.yml      # Production запуск
├── docker-compose.dev.yml  # Development запуск
├── nginx.conf             # Конфигурация Nginx
└── .dockerignore          # Исключения для Docker
```

## 🚀 Быстрый старт

### Production режим

```bash
# Собрать и запустить
docker-compose up --build

# Или в фоновом режиме
docker-compose up -d --build

# Остановить
docker-compose down
```

Приложение будет доступно на: **http://localhost:3000**

### Development режим (с hot reload)

```bash
# Собрать и запустить
docker-compose -f docker-compose.dev.yml up --build

# Или в фоновом режиме
docker-compose -f docker-compose.dev.yml up -d --build

# Остановить
docker-compose -f docker-compose.dev.yml down
```

Приложение будет доступно на: **http://localhost:3000**

## 📋 Команды Docker

### Сборка образа

```bash
# Production
docker build -t ai-tutor-frontend:latest .

# Development
docker build -f Dockerfile.dev -t ai-tutor-frontend:dev .
```

### Запуск контейнера

```bash
# Production
docker run -d -p 3000:80 --name ai-tutor-frontend ai-tutor-frontend:latest

# Development
docker run -d -p 3000:3000 -v $(pwd)/src:/app/src --name ai-tutor-frontend-dev ai-tutor-frontend:dev
```

### Управление контейнерами

```bash
# Список запущенных контейнеров
docker ps

# Список всех контейнеров
docker ps -a

# Остановить контейнер
docker stop ai-tutor-frontend

# Удалить контейнер
docker rm ai-tutor-frontend

# Просмотр логов
docker logs ai-tutor-frontend

# Следить за логами в реальном времени
docker logs -f ai-tutor-frontend

# Зайти внутрь контейнера
docker exec -it ai-tutor-frontend sh
```

### Очистка

```bash
# Удалить все остановленные контейнеры
docker container prune

# Удалить неиспользуемые образы
docker image prune

# Удалить всё (контейнеры, образы, volumes)
docker system prune -a
```

## 🔧 Конфигурация

### Переменные окружения

Создайте файл `.env` в корне проекта:

```env
# API Backend URL
REACT_APP_API_URL=http://localhost:8080

# Другие переменные
REACT_APP_ENV=production
```

### Nginx конфигурация

Отредактируйте `nginx.conf` для настройки:
- Проксирования API
- Кэширования
- Gzip сжатия
- CORS заголовков

## 🌐 Интеграция с Backend

### Вариант 1: Docker Compose с backend

Создайте общий `docker-compose.yml`:

```yaml
version: '3.8'

services:
  frontend:
    build: ./ai-tutor-frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
    networks:
      - ai-tutor-network

  backend:
    build: ./ai-tutor-backend
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=postgresql://...
    networks:
      - ai-tutor-network

networks:
  ai-tutor-network:
    driver: bridge
```

### Вариант 2: Nginx прокси

В `nginx.conf` настроен проксирование:

```nginx
location /api {
    proxy_pass http://backend:8080;
    # ... другие настройки
}
```

## 🐛 Отладка

### Проблема: Контейнер не запускается

```bash
# Проверить логи
docker logs ai-tutor-frontend

# Проверить статус
docker ps -a
```

### Проблема: Изменения не применяются (dev режим)

```bash
# Пересобрать без кэша
docker-compose -f docker-compose.dev.yml build --no-cache
docker-compose -f docker-compose.dev.yml up
```

### Проблема: Порт занят

```bash
# Найти процесс на порту 3000
lsof -i :3000

# Убить процесс
kill -9 <PID>
```

## 📊 Мониторинг

### Использование ресурсов

```bash
# Статистика контейнеров
docker stats

# Использование дискового пространства
docker system df
```

## 🚀 Деплой

### Docker Hub

```bash
# Войти в Docker Hub
docker login

# Тегировать образ
docker tag ai-tutor-frontend:latest yourusername/ai-tutor-frontend:latest

# Загрузить образ
docker push yourusername/ai-tutor-frontend:latest
```

### Production сервер

```bash
# На сервере
docker pull yourusername/ai-tutor-frontend:latest
docker run -d -p 80:80 --name ai-tutor-frontend yourusername/ai-tutor-frontend:latest
```

## ⚡ Оптимизация

### Multi-stage build

Dockerfile уже использует multi-stage build для оптимизации размера образа:
- **Build stage**: Node.js 22 Alpine (сборка)
- **Production stage**: Nginx Alpine (запуск)

### Размер образа

```bash
# Проверить размер образа
docker images ai-tutor-frontend

# Ожидаемый размер: ~50-80 MB (production)
```

## 🔒 Безопасность

1. **Non-root пользователь**: Nginx запускается от имени nginx
2. **Alpine Linux**: Минимальная поверхность атаки
3. **Multi-stage build**: Исходный код не попадает в production образ
4. **Health checks**: Автоматическая проверка работоспособности

## 📝 Чеклист перед production

- [ ] Установить правильный `REACT_APP_API_URL`
- [ ] Настроить CORS в nginx.conf
- [ ] Добавить SSL/TLS сертификаты
- [ ] Настроить логирование
- [ ] Установить resource limits в docker-compose
- [ ] Настроить мониторинг и алерты
- [ ] Провести load testing

## 🆘 Помощь

Проблемы с Docker? Проверьте:
1. Docker версия: `docker --version` (требуется 20.10+)
2. Docker Compose версия: `docker-compose --version` (требуется 1.29+)
3. Доступные ресурсы: RAM, CPU, Disk

