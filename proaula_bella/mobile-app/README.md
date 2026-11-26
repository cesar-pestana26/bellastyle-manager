# BellaStyle · App móvil (Vue 3 + Ionic + Capacitor)

App Android de **BellaStyle Manager**. Usa la plantilla del curso
(`arrietajohn/user-admin-vuejs-ionic-app`, arquitectura limpia) y se conecta a la
**misma API** de la web: `https://bellastyle.onrender.com/api` (Node.js + Express + MySQL en Aiven).

## Qué hace
- Iniciar sesión (Clienta, Estilista, Administradora) y registrarse como clienta.
- Agendar cita con las **horas libres reales** (`/api/disponibilidad`), estilista o "Cualquiera disponible".
- Pagar la cita con el **QR Bre-B** del salón (número de comprobante → "Por verificar") o en el salón.
- Cancelar y calificar citas.
- Tienda: carrito y pedido (`/api/pedidos`, el servidor valida precio y stock en una transacción).
- Cambiar contraseña y cerrar sesión. La estilista ve su agenda.

## Arquitectura (src/)
| Carpeta | Capa | Qué contiene |
|---|---|---|
| `domain/` | Dominio | Modelos (`BellaModels.ts`), puerto `SessionStore`, errores |
| `application/services/` | Casos de uso | `BellaApplicationService.ts`: login, agendar, pagar, pedidos… |
| `adapters/` | Adaptadores | `HttpClient.ts` (API REST + token JWT) y `BrowserSessionStore.ts` (sesión y carrito) |
| `bootstrap/` | Arranque | `container.ts` (inyección de dependencias y URL del servidor), `native.ts` (barra de estado, teclado, botón atrás) |
| `entrypoint/gui/` | Interfaz | `App.vue`, `router.ts`, vistas Vue + Ionic |

En el celular, `CapacitorHttp` hace las peticiones de forma nativa, así que no hace falta configurar CORS en el backend.

## Probar en el computador
```
npm install
npm run dev          (abre http://localhost:5174, usa la API de Render)
```
Para usar el backend local: crear `.env` con `API_PROXY_TARGET=http://localhost:3000`.

## Generar el APK
```
npm install
npm run build
npx cap sync android
npx cap open android
```
En Android Studio: **Build → Build App Bundle(s) / APK(s) → Build APK(s)**.
El APK queda en `android/app/build/outputs/apk/debug/app-debug.apk`.
