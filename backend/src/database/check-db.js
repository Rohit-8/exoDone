import pool from '../config/database.js';

async function checkDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('📊 Checking database contents...\n');

    const categoriesResult = await client.query('SELECT id, name, slug FROM categories ORDER BY id');
    console.log('Categories:', categoriesResult.rows);

    const topicsResult = await client.query('SELECT id, name, slug, category_id FROM topics ORDER BY id');
    console.log('\nTopics:', topicsResult.rows);

    const lessonsResult = await client.query('SELECT id, title, slug, topic_id FROM lessons ORDER BY id');
    console.log('\nLessons:', lessonsResult.rows);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

checkDatabase();
