# Habbit SFU

## Концепция
Habbit SFU — приложение для студентов СФУ, агрегирующее учебную активность
(дедлайны, задания, курсы, оценки, календарь). Сервис работает поверх Екурсов
и не дублирует его, а нормализует данные и формирует единый поток задач и
уведомлений, снижая вероятность пропуска дедлайнов.

## Архитектура
- **Mobile (Expo/React Native)** → UI и локальное состояние.
- **Backend (FastAPI)** → нормализация данных, агрегация и API для клиента.
- **Moodle Web Services** → первичный источник данных (Екурсы).

## Слои backend
| Слой | Ответственность |
|---|---|
| **API (`app/api`)** | HTTP‑маршруты, зависимости, валидация входных данных |
| **Services (`app/services`)** | Бизнес‑логика, оркестрация доступа к Moodle/БД |
| **Repositories (`app/repositories`)** | Доступ к БД и модели хранения |
| **Domain (`app/domain`)** | ORM‑модели и Pydantic‑схемы |
| **Clients (`app/clients`)** | Интеграции с внешними API (Moodle) |
| **Core/DB (`app/core`, `app/db`)** | Конфигурация и сессии БД |

## Компоненты репозитория
- `backend/` — FastAPI + PostgreSQL + Alembic.
- `mobile/` — Expo/React Native клиент.
- `web/` — зарезервировано (пока пусто).

## Moodle Web Services (нужные функции)
**Пользователь**
- `core_webservice_get_site_info`
- `core_user_get_users_by_field`

**Курсы**
- `core_enrol_get_users_courses`
- `core_course_get_courses`
- `core_course_get_contents`

**Задания**
- `mod_assign_get_assignments`
- `mod_assign_get_submission_status`
- `mod_assign_get_submissions`

**Оценки**
- `gradereport_user_get_grades_table`
- `core_grades_get_grades`

**Календарь**
- `core_calendar_get_calendar_events`

**Обновления / уведомления**
- `core_course_get_updates_since`
- `core_message_get_messages`

## Аутентификация
Backend использует Moodle `wstoken`, который передаётся в query‑параметре
`wstoken=...` для запросов к защищённым эндпоинтам.
