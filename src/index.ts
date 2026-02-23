import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import * as schema from "./schema";
import { DefaultLogger, LogWriter } from "drizzle-orm/logger";
import "dotenv/config";

// SQLログを見やすく出力するカスタムライター
class MyLogWriter implements LogWriter {
  write(message: string) {
    console.log(`\n\x1b[36m[実行されたSQL] \n${message}\x1b[0m\n`);
  }
}

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const db = drizzle(client, { 
    schema, 
    logger: new DefaultLogger({ writer: new MyLogWriter() }) 
  });

  console.log("=== 1. 初期データの投入 ===");
  // (※検証のため、既存データを一度クリア)
  await db.delete(schema.enrollments);
  await db.delete(schema.students);
  await db.delete(schema.courses);

  const studentData = await db.insert(schema.students).values([
    { name: "高専 太郎" },
    { name: "高専 花子" },
  ]).returning();

  const courseData = await db.insert(schema.courses).values([
    { title: "データベース工学" },
    { title: "アルゴリズム論" },
  ]).returning();

  // 太郎がDB工学とアルゴリズムを、花子がDB工学を履修
  await db.insert(schema.enrollments).values([
    { studentId: studentData[0].id, courseId: courseData[0].id },
    { studentId: studentData[0].id, courseId: courseData[1].id },
    { studentId: studentData[1].id, courseId: courseData[0].id },
  ]);

  console.log("=== 2. 検証：リレーションを含むデータ取得 ===");
  // DrizzleのRelational Queriesを利用して、ネストされたデータを一括取得
  const results = await db.query.students.findMany({
    with: {
      enrollments: {
        with: { course: { columns: { title: true } } }
      }
    }
  });

  console.log("--- 取得結果（JSON） ---");
  console.dir(results, { depth: null });

  await client.end();
}

main();