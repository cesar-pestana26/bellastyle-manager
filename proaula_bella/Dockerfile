FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json backend/
RUN cd backend && npm ci --omit=dev

COPY backend/ backend/
COPY frontend/ frontend/
COPY img/ img/
COPY init_db.sql ./

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

WORKDIR /app/backend
CMD ["node", "app.js"]
