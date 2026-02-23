# ./Dockerfile
FROM postgres:17.6

# 日本語ロケールを生成
RUN apt-get update \
 && apt-get install -y --no-install-recommends locales \
 && sed -i '/ja_JP.UTF-8/s/^# //g' /etc/locale.gen \
 && locale-gen \
 && rm -rf /var/lib/apt/lists/*

# サーバープロセスのデフォルト環境
ENV LANG=ja_JP.UTF-8 \
    LANGUAGE=ja_JP:ja \
    LC_MESSAGES=ja_JP.UTF-8

# 初期クラスタの既定ロケール/エンコーディング（初回 initdb 時のみ有効）
ENV POSTGRES_INITDB_ARGS="--locale=ja_JP.UTF-8 --encoding=UTF8"