# Especificación del proyecto – Inventario

Este documento define el destino del proyecto, la arquitectura y todo lo que debe implementarse (frontend React, backend Nest.js, base de datos PostgreSQL).

---

## 1. Destino en AWS

- **Base de datos**: PostgreSQL en **Amazon RDS** (no local en producción).
- **Aplicación**: Frontend y backend van en **contenedores Docker** desplegados en **EC2** (misma instancia o separadas según diseño).
- **Configuración**: Usar variables de entorno para `DB_HOST` (endpoint RDS), `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, `CORS_ORIGIN`, etc. El backend ya tiene `src/config/envs.ts` preparado para esto.

---

## 2. Autenticación (JWT)

- **Login**: Una pantalla de login (usuario/email + contraseña) que consuma un endpoint del backend.
- **Backend**: Endpoint de login que valide credenciales y devuelva un **JSON Web Token (JWT)**. Todas las rutas protegidas deben validar el JWT (guard, middleware o interceptor en Nest).
- **Frontend**: Tras login correcto, guardar el JWT (p. ej. en memoria + persistir en `localStorage` o cookie según criterio). Enviar el token en el header `Authorization: Bearer <token>` en todas las peticiones a la API. Rutas internas de la app (paneles) deben estar protegidas: si no hay token válido, redirigir al login.

---

## 3. Paneles y funcionalidad a implementar

### 3.1 Panel de login
- Pantalla de login con campos usuario/email y contraseña.
- Llamada al endpoint de auth del backend; guardar JWT y redirigir al panel principal (o dashboard).
- Manejo de errores (credenciales inválidas, red, etc.).

### 3.2 Panel de ventas
- CRUD o flujo de ventas (registro de ventas, listado, detalle).
- Relación con productos y/o inventario según modelo de datos.
- Acceso solo con JWT válido.

### 3.3 Panel de productos
- CRUD de productos (nombre, código, precio, unidad, etc. según modelo).
- Listado, filtros, búsqueda si aplica.
- Acceso solo con JWT válido.

### 3.4 Panel de inventario (lo que ya estaba)
- Gestión de inventario/stock: entradas, salidas, movimientos, niveles por producto o por ítem.
- Debe replicar la funcionalidad que ya existía en el proyecto anterior (listado de ítems, ajustes, historial si aplica).
- Acceso solo con JWT válido.

---

## 4. Resumen de lo que hay que hacer

### Backend (Nest.js + PostgreSQL)
- [ ] Conectar Nest a PostgreSQL (TypeORM o Prisma) usando `envs.database`.
- [ ] Módulo de **auth**: login, emisión de JWT, guard de JWT para rutas protegidas.
- [ ] Módulo **usuarios** (o integrado en auth): entidad usuario, contraseña hasheada (bcrypt o similar).
- [ ] Módulo **productos**: entidad, controlador, servicio, CRUD.
- [ ] Módulo **ventas**: entidad(es), controlador, servicio (crear/listar ventas y relación con productos/inventario).
- [ ] Módulo **inventario**: entidades (stock, movimientos, etc.), controlador, servicio (lo que ya estaba en el proyecto anterior).
- [ ] CORS y variables de entorno listas para EC2/RDS (ya parcialmente en `envs.ts`).
- [ ] Dockerfile para el backend (y opcionalmente docker-compose para local/EC2).

### Frontend (React + Vite)
- [ ] Pantalla de **login** y flujo de auth (envío de token en headers).
- [ ] Router con rutas protegidas: si no hay JWT válido → redirigir a login.
- [ ] **Panel de ventas**: vistas y llamadas al API de ventas.
- [ ] **Panel de productos**: vistas y llamadas al API de productos.
- [ ] **Panel de inventario**: vistas y llamadas al API de inventario (replicar lo que ya estaba).
- [ ] Layout común (navegación entre paneles, cerrar sesión).
- [ ] Variables de entorno para la URL del API (diferente en local vs EC2).

### DevOps / despliegue
- [ ] Dockerfile para frontend (build estático servido por nginx o por el backend, según diseño).
- [ ] Configuración para ejecutar contenedores en EC2 (y opcionalmente docker-compose).
- [ ] En producción, `DB_HOST` apuntando al RDS; `JWT_SECRET` y `CORS_ORIGIN` configurados de forma segura.

---

## 5. Estado actual del código

- **Backend**: Nest recién creado con `AppModule`, `AppController`, `AppService` y `src/config/envs.ts` (puerto, DB, CORS, JWT_SECRET). Aún no hay base de datos conectada ni auth.
- **Frontend**: React + Vite por defecto (contador y logos). Aún no hay login ni paneles.

Al desarrollar, usar esta especificación como referencia para que todo lo que “ya estaba” (inventario) y lo nuevo (login JWT, ventas, productos, AWS/Docker) quede implementado y coherente.
