# drizzle-Experiment



## 8. 演習問題の解答と解説

### Q1. 指定した授業を履修している学生の一覧を取得する

**【解答コード例】**
条件を指定するための eq 関数をインポートし、courses テーブルを起点に中間テーブルを跨いで students テーブルを結合します。
以下のコードを src/q1.ts などのファイルに保存して実行（npx tsx src/q1.ts）することで、完全な一連の処理を確認できます。

```typescript
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import * as schema from "./schema";
import { eq } from "drizzle-orm";
import "dotenv/config";

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const db = drizzle(client, { schema });

  console.log("=== Q1: 指定した授業を履修している学生の一覧を取得する ===");

  // 1. データベース工学の授業情報と、それに紐づく履修情報を取得
  const courseData = await db.query.courses.findFirst({
    where: eq(schema.courses.title, "データベース工学"),
    with: {
      enrollments: {
        with: {
          student: {
            columns: { name: true } // 学生の名前のみ取得
          }
        }
      }
    }
  });

  // 2. 結果から学生の名前だけを配列として抽出
  const studentNames = courseData?.enrollments.map(e => e.student.name) || [];
  console.log("【結果】データベース工学を履修している学生:", studentNames);

  await client.end();
}

main();

```


Q2. EXPLAIN ANALYZE による実行計画の確認とコスト分析

【DbGateでの実行文】
```
EXPLAIN ANALYZE  -- (省略: 4.1で出力されたSQLをそのまま貼り付ける)
```


【出力結果の例（環境によって数値は異なります）】

```
QUERY PLAN
Nested Loop Left Join  (cost=105.00..14714.76 rows=140 width=552) (actual time=0.050..0.059 rows=2 loops=1)
  ->  Seq Scan on students  (cost=0.00..11.40 rows=140 width=520) (actual time=0.008..0.009 rows=2 loops=1)
  ->  Aggregate  (cost=105.00..105.01 rows=1 width=32) (actual time=0.022..0.023 rows=1 loops=2)
        ->  Nested Loop Left Join  (cost=4.39..104.95 rows=11 width=40) (actual time=0.016..0.018 rows=2 loops=2)
              ->  Bitmap Heap Scan on enrollments students_enrollments  (cost=4.24..14.91 rows=11 width=8) (actual time=0.007..0.007 rows=2 loops=2)
                    Recheck Cond: (student_id = students.id)
                    Heap Blocks: exact=2
                    ->  Bitmap Index Scan on enrollments_student_id_course_id_pk  (cost=0.00..4.24 rows=11 width=0) (actual time=0.004..0.004 rows=2 loops=2)
                          Index Cond: (student_id = students.id)
              ->  Subquery Scan on students_enrollments_course  (cost=0.14..8.17 rows=1 width=32) (actual time=0.006..0.006 rows=1 loops=3)
                    ->  Limit  (cost=0.14..8.16 rows=1 width=520) (actual time=0.004..0.004 rows=1 loops=3)
（以下略）
```
【解説（コストの特定）】
実行計画（Execution Plan）を読むと、どの処理に負荷がかかっているかが cost=... の数値で推測できます。

今回の検証環境ではデータ量が極端に少ないため、インデックスを使用しない**順次走査（Seq Scan）が選択されています。
注目すべきは、Seq Scan on enrollments の箇所にある Filter: (student_id = students.id) です。これは、「学生を1件見つけるたびに、履修登録テーブル(enrollments)を全件走査（Seq Scan）して該当する学生IDを探している」**ことを意味します（Nested Loop Joinの挙動）。

もし enrollments テーブルに数百万件のデータがあった場合、このループ処理内の Seq Scan は致命的なパフォーマンス低下を引き起こし、最大のコスト要因となります。
これを防ぐためには、データベース工学の定石通り、外部キーである student_id や course_id に対してインデックス（Index）を作成する必要があります。
