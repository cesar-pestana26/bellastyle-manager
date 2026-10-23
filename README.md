# Proyecto de Aula — BellaStyle Manager

| Carpeta / archivo | Contenido |
|---|---|
| `proaula_bella/` | Código del sistema (backend Node.js + frontend Tailwind + base de datos). Incluye `Dockerfile` y `docker-compose.yml` para ejecutarlo con Docker. Ver su README para ejecutarlo. |
| `docs/Manual_de_Usuario` (.docx / .pdf) | Manual de usuario (estructura guía SENA). |
| `docs/Manual_Tecnico` (.docx / .pdf) | Manual técnico (estructura guía SENA). |
| `docs/Guia_Diagrama_Componentes_sin_flechas` (.docx / .pdf) | Cómo explicar el diagrama de componentes. |
| `docs/diagramas/` | Casos de uso, clases, secuencia, componentes, comunicación, despliegue (local y en la nube), modelo de datos y mapa de navegación. Las fuentes PlantUML están en `fuentes/`. |
| `analisis de negocio-requisitos-salon de belleza.docx` | Análisis de negocio y requisitos. |
| `funcionalidades de producto.xlsx` | Lista de funcionalidades. |
| `BellaStyle-Manager.pptx` | Presentación. |

## Últimos cambios (octubre 2026)

- **Docker:** `Dockerfile` y `docker-compose.yml` (app + MySQL) en `proaula_bella/`. Se ejecuta con `docker compose up --build`.
- **Configuración por variables de entorno** (`backend/config/config.js`): base de datos, puerto y código de administradora, para poder publicarlo en la nube.
- **Base de datos en la nube:** MySQL en Aiven (conexión cifrada SSL).
- **Diagramas nuevos:** `Diagrama_Comunicacion.png` (la clienta agenda una cita) y `Diagrama_Despliegue_Nube.png` (Render + Docker + MySQL en la nube).
- **Pendiente:** definir el servidor de publicación y la versión móvil.
