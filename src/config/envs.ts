/**
 * Configuración por ambiente.
 * En producción, en el .env solo necesitas poner APP_ENV=P (o APP_ENV=prod).
 *
 * Valores aceptados para APP_ENV:
 * - dev / D / development → dev (local)
 * - qa / Q → qa
 * - prod / P / production → prod
 *
 * INFRAESTRUCTURA DB:
 * - LOCAL: DB no es pública. Conéctate por túnel SSH (localhost:5432 → EC2 → Aurora).
 *   Usar DB_HOST=localhost, DB_PORT=5432.
 * - EC2/DOCKER: Contenedores en la misma VPC que Aurora. Acceso directo al endpoint privado.
 *   Usar DB_HOST=<endpoint-privado-aurora>, DB_PORT=5432.
 * - No hardcodear credenciales; todo via variables de entorno.
 */
const raw = (process.env.APP_ENV ?? 'dev').toString().toUpperCase();
const env =
  raw === 'P' || raw === 'PROD' || raw === 'PRODUCTION'
    ? 'prod'
    : raw === 'Q' || raw === 'QA'
      ? 'qa'
      : 'dev';

export const envs = {
  /** Ambiente actual: 'dev' | 'qa' | 'prod' */
  env,
  isDev: env === 'dev',
  isQa: env === 'qa',
  isProd: env === 'prod',

  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',

  /**
   * Base de datos (PostgreSQL).
   * - LOCAL: DB_HOST=localhost (túnel SSH hacia Aurora o Postgres local).
   * - EC2/Docker: DB_HOST=endpoint privado de Aurora (ej. xxx.cluster-xxx.region.rds.amazonaws.com).
   */
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    name: process.env.DB_NAME ?? 'inventory',
    user: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    /** Tamaño del pool de conexiones (pg). Por defecto 10. En contenedores puede bajarse. */
    poolSize: parseInt(process.env.DB_POOL_SIZE ?? '10', 10),
    /** Timeout de conexión en ms. Útil en Docker/EC2 si Aurora tarda en responder. */
    connectTimeoutMs: parseInt(process.env.DB_CONNECT_TIMEOUT_MS ?? '10000', 10),
    /** SSL: Aurora y muchos RDS exigen cifrado. Local con Postgres sin SSL puede ser false. */
    ssl: process.env.DB_SSL === 'true' || process.env.DB_SSL === '1',
    /** Si true (por defecto), verifica el certificado del servidor. Si sale "unable to get local issuer certificate", pon DB_SSL_REJECT_UNAUTHORIZED=false (túnel/Aurora). */
    sslRejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' && process.env.DB_SSL_REJECT_UNAUTHORIZED !== '0',
    get url(): string {
      const { host, port, name, user, password } = this;
      return `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${name}`;
    },
  },

  /** CORS: en prod conviene restringir origin (URL del frontend) */
  cors: {
    get origin(): boolean | string {
      const v = process.env.CORS_ORIGIN;
      if (v === undefined || v === '') return env === 'prod' ? false : true;
      if (v === 'true' || v === '1') return true;
      if (v === 'false' || v === '0') return false;
      return v;
    },
  },

  /** JWT u otras claves (ejemplo) */
  jwtSecret: process.env.JWT_SECRET ?? 'change-in-prod',
} as const;

export type EnvName = 'dev' | 'qa' | 'prod';
