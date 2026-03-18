# Si el login devuelve 500 (Internal Server Error)

1. **Mira la consola del backend** (terminal donde corre `npm run start:dev`). Ahora se imprime el error real, por ejemplo:
   - `column "documentId" does not exist` → el esquema de la base de datos está desactualizado.
   - `password authentication failed` → revisa `DB_PASSWORD` en tu `.env`.

2. **Si el error menciona columnas o "relation"**: resetea la base para que TypeORM cree las tablas de nuevo.

   Con Postgres en Docker (desde la carpeta `backend/`):
   ```bash
   docker compose down -v
   docker compose up -d
   npm run start:dev
   ```
   El `-v` borra el volumen y la base se crea de cero con el esquema correcto.

   Si usas Postgres local (psql):
   ```bash
   psql -U postgres -c "DROP DATABASE IF EXISTS inventory;"
   psql -U postgres -c "CREATE DATABASE inventory;"
   ```
   Luego reinicia el backend: `npm run start:dev`.

3. **Login por defecto**: documento `12345`, contraseña `Admin123!`
