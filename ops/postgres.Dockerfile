FROM postgis/postgis:15-3.3-alpine

RUN apk add --no-cache --virtual .build-deps \
    coreutils \
    gcc \
    make \
    musl-dev \
    postgresql-dev \
    git \
    clang15 \
    llvm15-dev

RUN git clone https://github.com/pgpartman/pg_partman.git /tmp/pg_partman \
    && cd /tmp/pg_partman \
    && git checkout v4.7.4 \
    && make \
    && make install \
    && cd / \
    && rm -rf /tmp/pg_partman

RUN git clone https://github.com/pgvector/pgvector.git /tmp/pgvector \
    && cd /tmp/pgvector \
    && git checkout v0.5.1 \
    && make \
    && make install \
    && cd / \
    && rm -rf /tmp/pgvector \
    && apk del .build-deps

# ─── Init Script: Create apex_dev_blank DB and enable extensions ──────────────
# This runs ONLY on first cluster creation (empty volume).
# For existing volumes, run: ops/scripts/init-db.sh manually after deploy.
COPY ops/scripts/02-enable-extensions.sql /docker-entrypoint-initdb.d/02-enable-extensions.sql
