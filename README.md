# 🍣 OCH! SUSHI – System zamówień online

Backend systemu zamówień online dla restauracji **OCH! SUSHI – Kuchnia Japońska**.  
Umożliwia składanie zamówień z płatnością online (Stripe) oraz automatyczne powiadomienia e-mail do restauracji.

---

## 📋 Spis treści

1. [Opis projektu](#-opis-projektu)
2. [Wymagania](#-wymagania)
3. [Instalacja krok po kroku](#-instalacja-krok-po-kroku)
4. [Konfiguracja Stripe](#-konfiguracja-stripe)
5. [Konfiguracja email (SMTP)](#-konfiguracja-email-smtp)
6. [Uruchomienie](#-uruchomienie)
7. [Deployment (wdrożenie)](#-deployment-wdrożenie)
8. [Struktura plików](#-struktura-plików)
9. [API Endpoints](#-api-endpoints)
10. [Troubleshooting](#-troubleshooting-najczęstsze-problemy)

---

## 📖 Opis projektu

**OCH! SUSHI** to kompletny system zamówień online dla restauracji sushi, zbudowany w Node.js z frameworkiem Express. System obsługuje:

- 🛒 **Koszyk zakupowy** – klient wybiera dania i dodaje do koszyka
- 💳 **Płatności online** – bezpieczne płatności kartą przez Stripe
- 📧 **Powiadomienia email** – restauracja otrzymuje email z pełnymi szczegółami zamówienia
- 🚗 **Dostawa / odbiór osobisty** – klient wybiera metodę odbioru
- 🔒 **Bezpieczeństwo** – helmet, rate limiting, walidacja danych

---

## ⚙️ Wymagania

Przed rozpoczęciem upewnij się, że masz zainstalowane:

| Narzędzie     | Wersja minimalna | Link do pobrania                        |
| ------------- | ---------------- | --------------------------------------- |
| **Node.js**   | 18.0+            | [nodejs.org](https://nodejs.org/)       |
| **npm**       | 9.0+             | (instalowany z Node.js)                 |
| **Konto Stripe** | –             | [stripe.com](https://stripe.com/)       |
| **Konto email SMTP** | –        | np. Gmail, Outlook, własny serwer SMTP  |

Sprawdź wersję Node.js:

```bash
node --version   # powinno pokazać v18.x.x lub nowszy
npm --version    # powinno pokazać 9.x.x lub nowszy
```

---

## 🚀 Instalacja krok po kroku

### 1. Pobierz projekt

```bash
# Sklonuj repozytorium (lub skopiuj pliki ręcznie)
git clone <adres-repozytorium>
cd OchSushi
```

### 2. Zainstaluj zależności

```bash
npm install
```

To zainstaluje wszystkie potrzebne pakiety: Express, Stripe, Nodemailer, Helmet, itp.

### 3. Skonfiguruj zmienne środowiskowe

```bash
# Skopiuj plik przykładowy
cp .env.example .env

# Lub na Windows (PowerShell):
Copy-Item .env.example .env
```

### 4. Uzupełnij dane w pliku `.env`

Otwórz plik `.env` w edytorze i uzupełnij wszystkie wartości. Szczegóły konfiguracji znajdziesz w sekcjach poniżej.

---

## 💳 Konfiguracja Stripe

Stripe obsługuje płatności kartą w Twoim sklepie.

### Krok 1 – Załóż konto

1. Wejdź na [stripe.com](https://stripe.com/) i kliknij **„Start now"**
2. Wypełnij formularz rejestracyjny
3. Potwierdź adres email

### Krok 2 – Pobierz klucze API

1. Zaloguj się do [Dashboard Stripe](https://dashboard.stripe.com/)
2. Przejdź do **Developers → API keys**
3. Znajdziesz tam dwa klucze:
   - **Publishable key** (`pk_test_...`) – klucz publiczny (frontend)
   - **Secret key** (`sk_test_...`) – klucz prywatny (backend)

### Krok 3 – Wklej klucze do `.env`

```env
STRIPE_SECRET_KEY=sk_test_TwojKluczTajny
STRIPE_PUBLISHABLE_KEY=pk_test_TwojKluczPubliczny
```

### Krok 4 – Klucz publiczny w frontendzie

Otwórz plik `public/js/checkout.js` (lub odpowiedni plik frontendowy) i zamień placeholder na Twój klucz publiczny:

```javascript
const stripe = Stripe('pk_test_TwojKluczPubliczny');
```

### Klucze testowe vs produkcyjne

| Typ             | Prefix        | Do czego służy                                        |
| --------------- | ------------- | ----------------------------------------------------- |
| **Testowe**     | `pk_test_` / `sk_test_` | Testowanie – żadne prawdziwe pieniądze nie są pobierane |
| **Produkcyjne** | `pk_live_` / `sk_live_` | Prawdziwe transakcje – używaj dopiero na produkcji     |

> ⚠️ **Ważne:** Nigdy nie udostępniaj klucza `sk_...` (secret key) publicznie! Nie wrzucaj go do repozytorium git.

---

## 📧 Konfiguracja email (SMTP)

System wysyła powiadomienia o nowych zamówieniach na email restauracji.

### Przykład: Gmail

#### Krok 1 – Włącz weryfikację dwuetapową (2FA)

1. Wejdź na [myaccount.google.com/security](https://myaccount.google.com/security)
2. Włącz **Weryfikację dwuetapową**

#### Krok 2 – Wygeneruj hasło aplikacji

1. Wejdź na [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Wybierz aplikację **„Poczta"** i urządzenie **„Inne"** (wpisz np. „OCH SUSHI")
3. Google wygeneruje **16-znakowe hasło** – skopiuj je

#### Krok 3 – Uzupełnij `.env`

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=twoj-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
RESTAURANT_EMAIL=kontakt@ochsushi.pl
```

> 💡 **Wskazówka:** `RESTAURANT_EMAIL` to adres, na który będą przychodzić powiadomienia o zamówieniach. Może być inny niż `SMTP_USER`.

### Inne usługi SMTP

| Usługa    | Host                  | Port |
| --------- | --------------------- | ---- |
| Gmail     | smtp.gmail.com        | 587  |
| Outlook   | smtp.office365.com    | 587  |
| Yahoo     | smtp.mail.yahoo.com   | 587  |
| SendGrid  | smtp.sendgrid.net     | 587  |
| Mailgun   | smtp.mailgun.org      | 587  |

---

## ▶️ Uruchomienie

### Tryb produkcyjny

```bash
npm start
```

### Tryb deweloperski

```bash
npm run dev
```

Serwer wystartuje na porcie skonfigurowanym w `.env` (domyślnie `3000`):

```
🍣  OCH! SUSHI serwer uruchomiony na porcie 3000
   http://localhost:3000
```

Otwórz przeglądarkę i wejdź na `http://localhost:3000`, aby zobaczyć stronę.

---

## 🌐 Deployment (wdrożenie)

### Opcja 1: VPS z nginx (np. DigitalOcean, OVH, Hetzner)

#### 1. Zainstaluj Node.js na serwerze

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### 2. Prześlij pliki na serwer

```bash
scp -r ./OchSushi user@twoj-serwer:/var/www/ochsushi
```

#### 3. Zainstaluj zależności i uruchom

```bash
cd /var/www/ochsushi
npm install --production
```

#### 4. Użyj PM2 do zarządzania procesem

```bash
sudo npm install -g pm2
pm2 start server.js --name ochsushi
pm2 save
pm2 startup
```

#### 5. Skonfiguruj nginx jako reverse proxy

```nginx
server {
    listen 80;
    server_name ochsushi.pl www.ochsushi.pl;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 6. Dodaj certyfikat SSL (wymagane przez Stripe!)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d ochsushi.pl -d www.ochsushi.pl
```

> ⚠️ **Stripe wymaga HTTPS** do obsługi płatności na produkcji. Certyfikat SSL jest obowiązkowy!

### Opcja 2: Railway

1. Zaloguj się na [railway.app](https://railway.app/)
2. Kliknij **„New Project"** → **„Deploy from GitHub Repo"**
3. Połącz swoje repozytorium
4. Dodaj zmienne środowiskowe w zakładce **Variables** (wszystkie z `.env`)
5. Railway automatycznie wykryje Node.js i uruchomi `npm start`
6. Twoja aplikacja dostanie adres HTTPS (np. `ochsushi.up.railway.app`)

### Opcja 3: Render

1. Zaloguj się na [render.com](https://render.com/)
2. Kliknij **„New"** → **„Web Service"**
3. Połącz repozytorium GitHub
4. Ustaw:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Dodaj zmienne środowiskowe w zakładce **Environment**
6. Render automatycznie zapewni certyfikat SSL

### Ustawienie domeny

Po wdrożeniu na wybranym hostingu:

1. Kup domenę (np. na OVH, nazwa.pl, Cloudflare)
2. Ustaw rekordy DNS:
   - **A Record**: `@` → adres IP serwera
   - **CNAME**: `www` → Twoja domena lub adres hostingu
3. Poczekaj na propagację DNS (do 48h, zwykle kilka minut)
4. Skonfiguruj certyfikat SSL (Let's Encrypt lub hosting automatycznie)

---

## 📁 Struktura plików

```
OchSushi/
├── server.js              # Główny plik serwera Express
├── package.json           # Zależności i skrypty npm
├── .env.example           # Przykładowa konfiguracja
├── .env                   # Twoja konfiguracja (nie wrzucaj do git!)
├── README.md              # Ten plik
├── routes/
│   └── api.js             # Endpointy API (płatności, zamówienia)
└── public/                # Pliki statyczne (frontend)
    ├── index.html
    ├── css/
    ├── js/
    └── images/
```

---

## 🔌 API Endpoints

### `GET /api/health`

Sprawdza status serwera.

**Odpowiedź:**

```json
{
  "status": "ok",
  "timestamp": "2026-06-04T12:00:00.000Z"
}
```

---

### `POST /api/create-payment-intent`

Tworzy intencję płatności w Stripe.

**Body (JSON):**

```json
{
  "items": [
    { "id": "sushi-1", "name": "Nigiri łosoś", "price": 28.00, "quantity": 2 },
    { "id": "sushi-2", "name": "Maki tuńczyk", "price": 32.00, "quantity": 1 }
  ],
  "customer": {
    "name": "Jan Kowalski",
    "phone": "+48 123 456 789",
    "email": "jan@example.com",
    "address": "ul. Sushi 15, Warszawa",
    "deliveryMethod": "delivery",
    "notes": "Proszę bez wasabi"
  }
}
```

**Odpowiedź (200):**

```json
{
  "clientSecret": "pi_xxx_secret_yyy",
  "orderId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

**Błąd (400):**

```json
{
  "error": "Koszyk jest pusty. Dodaj produkty przed złożeniem zamówienia."
}
```

---

### `POST /api/confirm-order`

Potwierdza zamówienie po udanej płatności.

**Body (JSON):**

```json
{
  "orderId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "paymentIntentId": "pi_xxx",
  "items": [
    { "id": "sushi-1", "name": "Nigiri łosoś", "price": 28.00, "quantity": 2 }
  ],
  "customer": {
    "name": "Jan Kowalski",
    "email": "jan@example.com",
    "phone": "+48 123 456 789",
    "deliveryMethod": "delivery",
    "address": "ul. Sushi 15, Warszawa",
    "notes": ""
  },
  "total": 66.00
}
```

**Odpowiedź (200):**

```json
{
  "success": true,
  "orderId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "message": "Zamówienie zostało przyjęte!"
}
```

---

## 🔧 Troubleshooting (najczęstsze problemy)

### ❌ `Error: Cannot find module 'express'`

Nie zainstalowałeś zależności. Uruchom:

```bash
npm install
```

### ❌ `StripeAuthenticationError: Invalid API Key provided`

Twój klucz Stripe jest nieprawidłowy. Sprawdź:

1. Czy skopiowałeś pełny klucz `sk_test_...` do `.env`
2. Czy nie ma dodatkowych spacji
3. Czy plik `.env` jest w katalogu głównym projektu

### ❌ `Error: connect ECONNREFUSED` (SMTP)

Problem z połączeniem SMTP. Sprawdź:

1. Czy dane SMTP (host, port, user, hasło) w `.env` są poprawne
2. Czy masz włączone 2FA i wygenerowane hasło aplikacji (Gmail)
3. Czy Twój firewall nie blokuje portu 587

### ❌ `CORS error` w przeglądarce

Jeśli frontend działa na innej domenie niż backend:

1. Ustaw `CORS_ORIGIN` w `.env` na adres frontendu, np. `https://ochsushi.pl`
2. Lub na czas developmentu zostaw domyślną wartość (akceptuje wszystkie originy)

### ❌ Stripe nie działa – `IntegrationError`

1. Upewnij się, że na stronie jest załadowany skrypt: `<script src="https://js.stripe.com/v3/"></script>`
2. Sprawdź, czy klucz publiczny (`pk_test_...`) jest poprawny w pliku JS frontendu
3. Na produkcji Stripe wymaga HTTPS – sprawdź certyfikat SSL

### ❌ Email nie dociera

1. Sprawdź logi serwera – czy jest informacja o wysłanym emailu
2. Sprawdź folder SPAM u odbiorcy
3. Upewnij się, że `RESTAURANT_EMAIL` w `.env` jest poprawny
4. Jeśli używasz Gmail, sprawdź czy hasło aplikacji jest aktualne

### ❌ Port 3000 jest zajęty

Zmień port w pliku `.env`:

```env
PORT=3001
```

Lub znajdź i zamknij proces używający portu 3000:

```bash
# Linux/Mac
lsof -i :3000
kill -9 <PID>

# Windows (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess
Stop-Process -Id <PID>
```

---

## 📄 Licencja

Projekt stworzony dla restauracji OCH! SUSHI. Wszelkie prawa zastrzeżone.
