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
  // 【結果】データベース工学を履修している学生: [ '高専 太郎', '高専 花子' ]

  await client.end();
}

main();
