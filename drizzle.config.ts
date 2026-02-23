import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',      // マイグレーションファイルの出力先
  schema: './src/schema.ts', // スキーマ定義ファイルの場所（後で作ります）
  dialect: 'postgresql', // DBの種類
  dbCredentials: {
    url: process.env.DATABASE_URL!, // .envから読み込み
  },
});