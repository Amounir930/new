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
    && rm -rf /tmp/pg_partman \
    && apk del .build-deps
