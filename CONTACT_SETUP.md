# Configuração da área de contato

A área de contato usa **Cloudflare Turnstile** (anti-bot) e envia as mensagens para o seu **Telegram**. Nada vai para o seu e-mail diretamente; você controla tudo pelo Telegram.

## 1. Telegram (receber as mensagens)

1. Abra o Telegram e converse com [@BotFather](https://t.me/BotFather).
2. Envie `/newbot`, dê um nome e um username (ex: `MeuSiteContatoBot`).
3. Guarde o **token** que ele enviar (ex: `123456:ABC-DEF...`).
4. Para receber as mensagens no seu celular/computador:
   - Envie qualquer mensagem para o seu bot (ex: `/start`).
   - Acesse no navegador:  
     `https://api.telegram.org/bot<SEU_TOKEN>/getUpdates`
   - Procure `"chat":{"id":` no JSON; o número é o **chat_id** (ex: `-1001234567890` ou `123456789`).

## 2. Cloudflare Turnstile (anti-spam/anti-bot)

1. Acesse [dash.cloudflare.com](https://dash.cloudflare.com) → **Turnstile**.
2. Crie um widget (tipo “Managed”, domínio: `5diautil.com.br`).
3. Anote:
   - **Site Key** (pública) → vai no HTML.
   - **Secret Key** (privada) → só na Vercel.

## 3. Variáveis de ambiente na Vercel

No projeto na Vercel: **Settings → Environment Variables** e adicione:

| Nome | Valor | Observação |
|------|--------|------------|
| `TURNSTILE_SECRET_KEY` | Secret Key do Turnstile | Obrigatório |
| `TELEGRAM_BOT_TOKEN` | Token do BotFather | Obrigatório |
| `TELEGRAM_CHAT_ID` | Seu chat_id | Obrigatório |

Depois, faça um novo deploy.

## 4. Site Key no HTML (produção)

No **index.html**, troque o `data-sitekey` do Turnstile pelo seu **Site Key**:

Procure:

```html
<div class="cf-turnstile" id="turnstile-widget" data-sitekey="1x00000000000000000000AA"></div>
```

Substitua `1x00000000000000000000AA` pela sua **Site Key** do Turnstile.  
(O valor `1x00000000000000000000AA` é chave de teste do Cloudflare e funciona em desenvolvimento.)

---

## Segurança implementada

- **Honeypot**: campo invisível “website”; se for preenchido, a mensagem é ignorada (bot).
- **Turnstile**: validação no backend; sem token válido, nada é enviado.
- **Validação**: mensagem entre 10 e 2000 caracteres; nome e e-mail opcionais e limitados.
- **CORS**: API só aceita requisições do seu domínio (e localhost em dev).
- **Sem exposição**: e-mail e Telegram só existem no backend (variáveis de ambiente); o front nunca os vê.

Se quiser limitar ainda mais (ex.: máximo de envios por IP por hora), dá para acrescentar rate limit com [Upstash Redis](https://upstash.com) na função `/api/contact`.
