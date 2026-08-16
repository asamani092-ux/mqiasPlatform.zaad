# ===== 1) تثبيت الاعتماديات وبناء التطبيق =====
FROM node:22-bookworm-slim AS builder
WORKDIR /app

# openssl لـ Prisma · git لسحب حزم github: من package.json
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates git \
    && rm -rf /var/lib/apt/lists/*

# إن كان مستودع نظام التصميم خاصاً: مرّر GITHUB_TOKEN من كوليفاي (Build Arg)
ARG GITHUB_TOKEN=
RUN set -eux; \
  git config --global url."https://github.com/".insteadOf "ssh://git@github.com/"; \
  git config --global url."https://github.com/".insteadOf "git@github.com:"; \
  if [ -n "$GITHUB_TOKEN" ]; then \
    git config --global url."https://x-access-token:${GITHUB_TOKEN}@github.com/".insteadOf "https://github.com/"; \
  fi

COPY package.json package-lock.json ./
# تجاهل postinstall (prisma generate) — المخطط غير منسوخ بعد
RUN npm ci --ignore-scripts

COPY . .
# قيمة شكلية للبناء فقط — Prisma 7 يقرأ DATABASE_URL من prisma.config.ts عند generate
ENV DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build?schema=public"
RUN npx prisma generate
RUN npm run build

# ===== 2) صورة التشغيل النهائية (خفيفة) =====
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
# ضروري لـ Coolify/البروكسي — وإلا Bad Gateway لأن Next يستمع على localhost فقط
ENV HOSTNAME=0.0.0.0
ENV HOST=0.0.0.0

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

EXPOSE 3000
# Docker/Coolify يضبط HOSTNAME لاسم الحاوية — Next يفسّره كعنوان استماع فيحدث Bad Gateway
CMD ["sh", "-c", "export HOSTNAME=0.0.0.0; export HOST=0.0.0.0; exec node server.js"]
