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

**Если SSL на Nginx Proxy Manager** — certbot на контейнере **не нужен** (см. раздел NPM ниже).

Иначе на контейнере напрямую:

```bash
certbot --nginx -d trainer.izostudia.net
```

---

## Nginx Proxy Manager (NPM)

Схема: `Интернет → NPM (SSL) → LXC :80 (nginx) → /api → uvicorn`

### Proxy Host в NPM

| Поле | Значение |
|------|----------|
| Domain Names | `trainer.izostudia.net` |
| Scheme | **http** |
| Forward Hostname / IP | IP LXC, напр. `192.168.1.50` |
| Forward Port | **80** (не 443, не 8000, не 5173) |
| Block Common Exploits | выкл., если 502 |
| Websockets Support | вкл. |

SSL — только во вкладке **SSL** в NPM (Let's Encrypt).

### Advanced в NPM

```nginx
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_read_timeout 300s;
```

### Проверка (с машины где стоит NPM)

```bash
curl -I http://IP_LXC
curl http://IP_LXC/api/health
```

### Частые причины 502

1. В NPM указан порт **443** или **8000** вместо **80**
2. Неверный IP контейнера
3. `ufw` на LXC блокирует NPM — `ufw allow from IP_NPM to any port 80 proto tcp`
4. `systemctl status nginx` и `systemctl status izo-coach` не active

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
