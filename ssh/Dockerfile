# Build from the repo root:  docker compose up -d --build   (run inside ssh/)
FROM node:24-alpine

WORKDIR /app/ssh
COPY ssh/package.json ssh/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

COPY ssh/*.mjs ./
# Shared with the website: lift helpers and fortunes (plain TS, run via Node's type stripping)
COPY src/lib/liftsCore.ts src/lib/fortunes.ts /app/src/lib/
RUN echo '{"type":"module"}' > /app/src/package.json \
 && mkdir -p /data && chown node:node /data

USER node
ENV NODE_ENV=production DATA_DIR=/data PORT=2222 NODE_NO_WARNINGS=1
EXPOSE 2222
CMD ["node", "server.mjs"]
