FROM node:18-bookworm

# Install MongoDB (upstream repo), Redis, and serve for static frontend
RUN apt-get update && \
    apt-get install -y curl gnupg ca-certificates && \
    curl -fsSL https://pgp.mongodb.com/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg && \
    echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/debian bookworm/mongodb-org/7.0 main" \
      > /etc/apt/sources.list.d/mongodb-org-7.0.list && \
    apt-get update && \
    apt-get install -y mongodb-org redis-server && \
    npm install -g serve && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install frontend deps
COPY pmc-front/package*.json pmc-front/
RUN cd pmc-front && npm install --legacy-peer-deps

# Install backend deps
COPY nscm-backend/package*.json nscm-backend/
RUN cd nscm-backend && npm install --legacy-peer-deps

# Copy the rest of the repo
COPY . .

# Build frontend with configurable API base.
# Leave empty to default to "http(s)://<frontend-host>:3254/api" at runtime.
ARG VITE_API_BASE_URL=
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN cd pmc-front && npm run build

ENV PORT=3254
ENV FRONTEND_PORT=4173
ENV MONGO_DATA=/data/db

EXPOSE 3254 4173

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]

