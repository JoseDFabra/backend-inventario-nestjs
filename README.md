# Backend

El frontend de este proyecto es: https://github.com/JoseDFabra/frontend-enventario-react

- **Requisitos:** Node.js, PostgreSQL (o Docker para Postgres local).
- **Instalar:** `npm install`
- **Configurar:** Copiar `.env.template` a `.env` y ajustar `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`. Para Postgres en Docker: `docker compose up -d` y en `.env` usar `DB_PORT=5433`.
- **Desarrollo:** `npm run start:dev`
