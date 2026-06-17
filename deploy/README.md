# Деплой с GitHub на сервер

Репозиторий: **https://github.com/viva20033/coach**

Домен: **https://trainer.izostudia.net**

---

## Один раз: DNS + порты

```
A   trainer.izostudia.net   →   публичный IP
```

Проброс **80** и **443** на IP LXC-контейнера.

---

## Первый деплой (на сервере, root)

### Вариант 1 — одна команда

```bash
curl -fsSL https://raw.githubusercontent.com/viva20033/coach/main/deploy/bootstrap.sh | bash
```

### Вариант 2 — явно

```bash
apt update && apt install -y git
git clone https://github.com/viva20033/coach.git /opt/izo-coach
bash /opt/izo-coach/deploy/bootstrap.sh
```

---

## Groq API ключ

```bash
nano /opt/izo-coach/backend/.env
# GROQ_API_KEY=ваш_ключ
systemctl restart izo-coach
```

---

## HTTPS

```bash
certbot --nginx -d trainer.izostudia.net
```

---

## Обновление после push в GitHub

На сервере:

```bash
bash /opt/izo-coach/deploy/update.sh
```

Или вручную:

```bash
cd /opt/izo-coach && git pull && bash deploy/install-app.sh
```

---

## Локально: пуш изменений

```bash
git add .
git commit -m "описание изменений"
git push origin main
```

Затем на сервере: `bash /opt/izo-coach/deploy/update.sh`

---

## Секреты

| Файл | В git? |
|------|--------|
| `backend/.env` | **Нет** (в .gitignore) |
| `deploy/production.env.example` | Да (шаблон) |

Ключ Groq задаётся только на сервере в `/opt/izo-coach/backend/.env`.

---

## Команды

```bash
systemctl status izo-coach
journalctl -u izo-coach -f
systemctl restart izo-coach
nginx -t && systemctl reload nginx
```
