import pool from '../config/database.js';

async function checkLessons() {
  const client = await pool.connect();
  
  try {
    // Get all topics
    const topics = await client.query(`
      SELECT t.id, t.slug as topic_slug, t.name as topic_title, c.name as category_name,
             COUNT(l.id) as lesson_count
      FROM topics t
      JOIN categories c ON t.category_id = c.id
      LEFT JOIN lessons l ON l.topic_id = t.id
      GROUP BY t.id, t.slug, t.name, c.name
      ORDER BY c.name, t.name
    `);
    
    console.log('📚 Current Topic & Lesson Status:\n');
    
    let totalLessons = 0;
    let topicsWithNoLessons = [];
    
    topics.rows.forEach(topic => {
      const status = topic.lesson_count > 0 ? '✅' : '❌';
      console.log(`${status} [${topic.category_name}] ${topic.topic_title} (${topic.topic_slug}): ${topic.lesson_count} lesson(s)`);
      totalLessons += parseInt(topic.lesson_count);
      
      if (topic.lesson_count === 0) {
        topicsWithNoLessons.push(topic);
      }
    });
    
    console.log(`\n📊 Total Topics: ${topics.rows.length}`);
    console.log(`📊 Total Lessons: ${totalLessons}`);
    console.log(`📊 Topics without lessons: ${topicsWithNoLessons.length}\n`);
    
    if (topicsWithNoLessons.length > 0) {
      console.log('🎯 Topics needing lessons:');
      topicsWithNoLessons.forEach(topic => {
        console.log(`   - ${topic.topic_title} (${topic.topic_slug})`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkLessons();
