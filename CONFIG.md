# Configuración y entornos

Este documento describe cómo conectar el backend a la base de datos en **local** (túnel SSH), **EC2/Docker** y **producción**, sin hardcodear configuraciones.

> **Tip:** No cambias código, solo variables de entorno.  
> **Desarrollo:** Postgres en Docker → `DB_HOST=localhost`, `DB_PORT=5433`, sin SSL.  
> **QA / EC2:** Aurora en AWS → `DB_HOST=<endpoint-aurora>`, `DB_PORT=5432`, `DB_SSL=true`.

## Resumen: Desarrollo vs QA

| Dónde      | Base de datos      | Qué usar en `.env` |
|-----------|--------------------|--------------------|
| **Desarrollo** (tu máquina) | Postgres en Docker (`docker compose up -d`) | `DB_HOST=localhost`, `DB_PORT=5433`, `DB_SSL` sin poner o `false`, usuario/contraseña del compose (ej. `postgres`/`postgres`). |
| **QA** (EC2 u otro servidor) | Aurora en AWS (misma VPC) | `DB_HOST=<endpoint-aurora>`, `DB_PORT=5432`, `DB_SSL=true`, usuario/contraseña de Aurora. |

En tu máquina tienes un `.env` para desarrollo (apuntando al Postgres de Docker). En el servidor de QA tienes otro `.env` (o variables inyectadas por el deploy) con los valores de Aurora. El mismo código sirve para ambos.

## Aurora recién creada (la base no existe aún)

Aurora empieza con la base `postgres` por defecto; la base de la app (`inventory` o la que pongas en `DB_NAME`) hay que crearla una vez:

1. Configura el `.env` (DB_HOST, DB_USER, DB_PASSWORD, **DB_NAME=inventory**, DB_SSL=true si aplica).
2. Si trabajas local, abre el túnel SSH al bastion.
3. Ejecuta: **`npm run db:create`**. El script se conecta a `postgres` y crea la base indicada en `DB_NAME`.
4. Arranca el backend (`npm run start:dev`). TypeORM creará las tablas si usas `synchronize` en dev.

A partir de ahí ya no necesitas volver a ejecutar `db:create`.

## Infraestructura

- **Base de datos**: Amazon RDS (Aurora PostgreSQL), **no pública** (solo red privada).
- **Acceso local**: mediante **túnel SSH** (port forwarding) a un bastion EC2: `localhost:5432` → EC2 → Aurora.
- **Acceso desde EC2/Docker**: contenedores en la misma VPC que Aurora; conexión **directa** al endpoint privado (no se usa túnel).

## Variables de entorno de base de datos

| Variable | Descripción | Local (túnel) | EC2/Docker |
|----------|-------------|----------------|------------|
| `DB_HOST` | Host de PostgreSQL | `localhost` | Endpoint privado Aurora (ej. `xxx.cluster-xxx.region.rds.amazonaws.com`) |
| `DB_PORT` | Puerto | `5432` | `5432` |
| `DB_NAME` | Nombre de la base | `inventory` | `inventory` |
| `DB_USER` | Usuario | según Aurora | según Aurora |
| `DB_PASSWORD` | Contraseña | según Aurora | según Aurora |
| `DB_SSL` | Usar SSL (Aurora/RDS suele exigirlo) | `false` o omitir | `true` |
| `DB_POOL_SIZE` | (opcional) Tamaño del pool | por defecto 10 | según carga |
| `DB_CONNECT_TIMEOUT_MS` | (opcional) Timeout conexión (ms) | por defecto 10000 | 10000 o más si la red es lenta |

Si ves el error *"no pg_hba.conf entry for host ... no encryption"*, el servidor exige conexión cifrada: pon **`DB_SSL=true`** en tu `.env`. Si luego aparece *"unable to get local issuer certificate"*, añade **`DB_SSL_REJECT_UNAUTHORIZED=false`** (habitual con túnel o Aurora).

**Si Aurora está vacía y la base `inventory` no existe:** ejecuta una vez (con el túnel activo o desde EC2, y el mismo `.env`):

```bash
npm run db:create
```

Ese script se conecta a la base `postgres` (siempre existe en Aurora/RDS) y crea la base indicada en `DB_NAME`. Después ya puedes arrancar el backend con normalidad.

Nunca hardcodear credenciales; todo debe venir del `.env` (o del sistema en EC2).

## Entorno local (desarrollo con túnel SSH)

1. **Crear túnel SSH** desde tu máquina al bastion y reenviar el puerto de Aurora:

   ```bash
   ssh -L 5432:<endpoint-aurora>:5432 usuario@<ip-o-dns-bastion>
   ```

   Así, en tu máquina `localhost:5432` llega a Aurora.

2. **Configurar `.env`** (copiar de `.env.example`):

   ```env
   APP_ENV=dev
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=inventory
   DB_USER=tu_usuario
   DB_PASSWORD=tu_password
   DB_SSL=true
   ```
   (Aurora suele exigir SSL; si usas Postgres local sin SSL, puedes omitir `DB_SSL` o poner `false`.)

3. Ejecutar el backend: `npm run start:dev`.

La app se conecta a `localhost:5432`, que mediante el túnel llega a Aurora. No hace falta tocar código al cambiar entre “solo local” y “local + túnel a Aurora”.

## Entorno EC2 / Docker (pruebas o producción)

- La base de datos **no** está en el mismo `docker-compose`: es Aurora en la VPC.
- En el servidor EC2, el `.env` debe tener el **endpoint privado** de Aurora:

  ```env
  APP_ENV=prod
  DB_HOST=tu-cluster.cluster-xxxxx.region.rds.amazonaws.com
  DB_PORT=5432
  DB_NAME=inventory
  DB_USER=...
  DB_PASSWORD=...
  ```

- Levantar el backend en Docker usando el ejemplo para EC2:

  ```bash
  docker compose -f docker-compose.ec2.example.yml up -d
  ```

Los contenedores acceden directamente a Aurora por la red privada; **no se usa túnel SSH** en EC2.

## Cuando pases a QA

En desarrollo usas Postgres en Docker; en QA quieres Aurora. No cambias código:

1. **En tu máquina (desarrollo):** `.env` con `DB_HOST=localhost`, `DB_PORT=5433`, sin `DB_SSL`. Levantas Postgres con `docker compose up -d` y el backend con `npm run start:dev`.
2. **En el servidor de QA:** el `.env` (o las variables que inyecte tu deploy) debe tener `DB_HOST=<endpoint-aurora>`, `DB_PORT=5432`, `DB_SSL=true` y las credenciales de Aurora. El mismo código del backend se ejecuta allí con esas variables.

Si en QA la base de Aurora aún no existe, ejecuta allí una vez (con el mismo `.env` de QA): `npm run db:create`.

## Cambiar entre entornos

| Objetivo | Cambio principal |
|----------|-------------------|
| **Desarrollo (Postgres en Docker)** | `DB_HOST=localhost`, `DB_PORT=5433`, sin SSL. `docker compose up -d` para Postgres. |
| **Local con túnel a Aurora** | `DB_HOST=localhost`, `DB_PORT=5432`, túnel SSH activo, `DB_SSL=true`. |
| **QA / EC2 con Aurora** | En el servidor: `DB_HOST=<endpoint-aurora>`, `DB_PORT=5432`, `DB_SSL=true`. |

El resto de variables (`DB_NAME`, `DB_USER`, `DB_PASSWORD`, etc.) son las mismas; solo cambian host, puerto y SSL según el entorno.

## Migraciones y esquema

El proyecto usa **TypeORM** con `synchronize: true` solo en desarrollo (`envs.isDev`). En QA/producción `synchronize` debe estar en `false`.

- **Local**: el esquema se puede actualizar con `synchronize` en dev o con migraciones de TypeORM si las añades.
- **Docker/EC2**: mismo código y mismas variables; las migraciones (si se usan) se ejecutan igual: al arrancar el contenedor o en un paso previo, usando el mismo `DB_*` del `.env`.

No hace falta configuración distinta para “local” vs “Docker” en lo que respecta a migraciones: solo hay que asegurar que `DB_HOST`, `DB_USER`, `DB_PASSWORD` y `DB_NAME` apunten al mismo entorno donde quieres aplicar cambios.

## Pool de conexiones y timeouts

- La conexión usa **pool** (TypeORM + `pg`); el tamaño se controla con `DB_POOL_SIZE` (por defecto 10).
- El timeout de conexión se controla con `DB_CONNECT_TIMEOUT_MS` (por defecto 10000 ms), útil en Docker/EC2 si Aurora tarda en responder.

Todo se lee desde `src/config/envs.ts` y se aplica en `app.module.ts` (TypeORM `extra`). No hay valores hardcodeados.

## Resumen

- **Local**: túnel SSH + `DB_HOST=localhost` en `.env`.
- **EC2/Docker**: `DB_HOST=<endpoint-privado-aurora>` en el `.env` del servidor, sin túnel.
- Configuración única vía variables de entorno; el mismo código sirve para todos los entornos.
