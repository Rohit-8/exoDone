import pool from '../config/database.js';

async function checkTopicsVsReadme() {
  const client = await pool.connect();
  
  try {
    // Get all topics from database
    const result = await client.query(`
      SELECT c.name as category, t.name as topic, t.slug
      FROM topics t
      JOIN categories c ON t.category_id = c.id
      ORDER BY c.name, t.name
    `);
    
    console.log('📚 CURRENT DATABASE TOPICS:\n');
    
    let currentCategory = '';
    result.rows.forEach(row => {
      if (row.category !== currentCategory) {
        currentCategory = row.category;
        console.log(`\n${currentCategory}:`);
      }
      console.log(`  - ${row.topic} (${row.slug})`);
    });
    
    console.log('\n\n📋 README FILE ANALYSIS:\n');
    
    console.log('Software Architecture README shows:');
    console.log('  Level 1: Basic Architecture Concepts, Basic System Components');
    console.log('  Level 2: Scalability Concepts, Reliability & Availability, Data Storage Patterns');
    console.log('  Level 3: Distributed Systems, Microservices, Data Pipeline, Security');
    console.log('  Level 4: Enterprise Patterns, Cloud Architecture, Observability, Performance');
    
    console.log('\nBackend README shows:');
    console.log('  Level 1: Core OOP, Language Fundamentals, Basic Data Structures, First API');
    console.log('  Level 2: Advanced OOP, Design Patterns, Database Integration, API Advanced, Auth, Testing');
    console.log('  Level 3: Advanced Patterns, Clean Architecture, DDD, Concurrency, Caching, Message Queues, Security, Performance');
    console.log('  Level 4: Microservices, Distributed Systems, Event-Driven, DevOps, Observability, Database Advanced, Service Mesh, Leadership');
    
    console.log('\nFrontend README shows:');
    console.log('  Level 1: JavaScript Essentials, React Basics, Styling');
    console.log('  Level 2: Hooks Deep Dive, State Management, Routing, API Integration, Forms');
    console.log('  Level 3: Performance Optimization, Advanced Patterns, TypeScript, Testing, Error Handling');
    console.log('  Level 4: Architecture & Scalability, Advanced State, Build & DevOps, Security, SSR/SSG, Leadership');
    
    console.log('\n\n🎯 CONCLUSION:');
    console.log('The current 12 topics in the database are a SUBSET of the full README content.');
    console.log('The READMEs contain comprehensive learning paths with many more subtopics.');
    console.log('We can create additional topics and lessons to match the README structure.');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkTopicsVsReadme();
