FROM node:20-slim AS deps

WORKDIR /app

# install dependencies
COPY package.json package-lock.json* ./
# prefer npm ci when lockfile exists, fallback to npm install
RUN apt-get update \
	&& apt-get install -y --no-install-recommends python3 build-essential make g++ ca-certificates curl \
	&& rm -rf /var/lib/apt/lists/*

# attempt `npm ci`, fall back to `npm install` on failure to handle lockfile inconsistencies
RUN sh -c 'if [ -f package-lock.json ]; then npm ci --prefer-offline --no-audit --no-fund || npm install --no-audit --no-fund; else npm install --no-audit --no-fund; fi'

FROM node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# build for production
RUN npm run build

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./

EXPOSE 3000

ENV NEXT_PUBLIC_API_URL=http://web:5000

CMD ["npm", "run", "start"]
