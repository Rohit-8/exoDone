import pool from '../config/database.js';

async function checkMissing() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT t.slug, t.name, COUNT(l.id) as lesson_count 
      FROM topics t 
      LEFT JOIN lessons l ON t.id = l.topic_id 
      WHERE t.slug IN ('typescript-react', 'testing-react', 'nextjs-ssr', 'api-design', 'caching-strategies', 'cloud-architecture', 'database-design')
      GROUP BY t.slug, t.name
      ORDER BY t.slug
    `);
    
    console.log('\n📊 Status of 7 Topics:\n');
    result.rows.forEach(row => {
      const status = row.lesson_count > 0 ? '✅' : '❌';
      console.log(`${status} ${row.name} (${row.slug}): ${row.lesson_count} lesson(s)`);
    });
    
    const missing = result.rows.filter(r => r.lesson_count == 0);
    console.log(`\n📌 Need to create: ${missing.length} lessons`);
    
  } finally {
    client.release();
    await pool.end();
  }
}

checkMissing();
