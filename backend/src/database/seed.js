// ============================================================================
// seed.js — Unified Seeder
// ============================================================================
//
// Single command to set up the entire database:
//   1. Creates categories
//   2. Walks  data/{category}/{difficulty}/{topic}/  folders
//   3. Imports  content.js + examples.js + quiz.js  from each topic folder
//   4. Inserts topics → lessons → code_examples → quiz_questions
//
// Usage:  npm run seed
// ============================================================================

import dotenv from 'dotenv';
dotenv.config();

import { readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import pool from '../config/database.js';

// ── Recursively find topic folders (folders that contain content.js) ────
async function findTopicFolders(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const folders = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const fullPath = join(dir, entry.name);

    // Check if this folder has content.js → it's a topic folder
    try {
      await stat(join(fullPath, 'content.js'));
      folders.push(fullPath);
    } catch {
      // Not a topic folder — recurse deeper
      folders.push(...(await findTopicFolders(fullPath)));
    }
  }

  return folders;
}

// ── Import a module safely (returns null on failure) ────────────────────
async function importSafe(filePath) {
  try {
    await stat(filePath);
    const mod = await import(pathToFileURL(filePath).href);
    return mod.default ?? mod;
  } catch {
    return null;
  }
}

// ════════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════════
async function seed() {
  const client = await pool.connect();

  // Resolve the data/ directory relative to this file
  const dataRoot = new URL('./data', import.meta.url);
  const dataRootPath = dataRoot.pathname.replace(/^\/([A-Z]:)/i, '$1');

  console.log('');
  console.log('══════════════════════════════════════════════════════════');
  console.log('  🌱  Interview Prep — Unified Seeder');
  console.log('══════════════════════════════════════════════════════════');

  try {
    await client.query('BEGIN');

    // ── 1. Clear everything ───────────────────────────────────────────
    console.log('  🗑️   Clearing existing data...');
    await client.query(
      'TRUNCATE users, categories, topics, lessons, code_examples, quiz_questions, user_progress, quiz_attempts RESTART IDENTITY CASCADE'
    );

    // ── 2. Insert categories ──────────────────────────────────────────
    console.log('  📂  Inserting categories...');
    const catResult = await client.query(`
      INSERT INTO categories (name, slug, description, icon, order_index) VALUES
      ('Software Architecture', 'architecture', 'Master system design from simple applications to complex distributed systems', '🏗️', 1),
      ('Backend Development',   'backend',      'Learn OOP, design patterns, and backend development in C#, Java, Python, or Node.js', '💻', 2),
      ('Frontend Development',  'frontend',     'Build modern user interfaces with React, hooks, and advanced patterns', '🎨', 3)
      RETURNING id, slug
    `);
    const categories = {};
    catResult.rows.forEach((r) => (categories[r.slug] = r.id));

    // ── 3. Discover topic folders ─────────────────────────────────────
    const topicFolders = await findTopicFolders(dataRootPath);
    console.log(`  📦  Found ${topicFolders.length} topic folder(s)\n`);

    if (topicFolders.length === 0) {
      console.log('  ⚠  No topic folders found. Only categories were created.');
      await client.query('COMMIT');
      return;
    }

    let topicCount = 0;
    let lessonCount = 0;
    let exampleCount = 0;
    let quizCount = 0;

    // ── 4. Process each topic folder ──────────────────────────────────
    for (const folderPath of topicFolders) {
      const rel = relative(dataRootPath, folderPath).replace(/\\/g, '/');
      const parts = rel.split('/');

      const categorySlug = parts[0]; // "frontend", "backend", "architecture"
      const difficulty = parts[1];   // "beginner", "intermediate", etc.
      const categoryId = categories[categorySlug];

      if (!categoryId) {
        console.log(`  ⚠  Skipping ${rel} — category "${categorySlug}" not found`);
        continue;
      }

      // ── Import the three data files ─────────────────────────────────
      const contentMod = await importSafe(join(folderPath, 'content.js'));
      if (!contentMod) {
        console.log(`  ⚠  Skipping ${rel} — missing content.js`);
        continue;
      }

      // content.js exports { topic, lessons } (named exports)
      const topic = contentMod.topic;
      const lessons = contentMod.lessons;

      if (!topic || !lessons) {
        console.log(`  ⚠  Skipping ${rel} — content.js missing topic/lessons`);
        continue;
      }

      // examples.js exports default { 'lesson-slug': [...] }
      const examplesMap = await importSafe(join(folderPath, 'examples.js')) || {};

      // quiz.js exports default { 'lesson-slug': [...] }
      const quizMap = await importSafe(join(folderPath, 'quiz.js')) || {};

      // ── Insert topic ────────────────────────────────────────────────
      const topicRes = await client.query(
        `INSERT INTO topics (category_id, name, slug, description, difficulty_level, estimated_time, order_index)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (slug) DO UPDATE SET
           name             = EXCLUDED.name,
           description      = EXCLUDED.description,
           difficulty_level = EXCLUDED.difficulty_level,
           estimated_time   = EXCLUDED.estimated_time,
           order_index      = EXCLUDED.order_index
         RETURNING id`,
        [categoryId, topic.name, topic.slug, topic.description, difficulty, topic.estimated_time, topic.order_index]
      );
      const topicId = topicRes.rows[0].id;
      topicCount++;

      // Remove existing lessons for idempotency (CASCADE deletes examples + quizzes)
      await client.query('DELETE FROM lessons WHERE topic_id = $1', [topicId]);

      // ── Insert lessons ──────────────────────────────────────────────
      for (const lesson of lessons) {
        const lessonRes = await client.query(
          `INSERT INTO lessons (topic_id, title, slug, content, summary, difficulty_level, estimated_time, order_index, key_points)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
          [topicId, lesson.title, lesson.slug, lesson.content, lesson.summary, lesson.difficulty_level, lesson.estimated_time, lesson.order_index, lesson.key_points]
        );
        const lessonId = lessonRes.rows[0].id;
        lessonCount++;

        // Code examples (looked up from examples.js by lesson slug)
        const codeExamples = examplesMap[lesson.slug] || [];
        for (const ce of codeExamples) {
          await client.query(
            `INSERT INTO code_examples (lesson_id, title, description, language, code, explanation, order_index)
             VALUES ($1,$2,$3,$4,$5,$6,$7)`,
            [lessonId, ce.title, ce.description, ce.language, ce.code, ce.explanation, ce.order_index]
          );
          exampleCount++;
        }

        // Quiz questions (looked up from quiz.js by lesson slug)
        const quizQuestions = quizMap[lesson.slug] || [];
        for (const q of quizQuestions) {
          await client.query(
            `INSERT INTO quiz_questions (lesson_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, order_index)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [lessonId, q.question_text, q.question_type, typeof q.options === 'string' ? q.options : JSON.stringify(q.options), q.correct_answer, q.explanation, q.difficulty, q.points || 10, q.order_index]
          );
          quizCount++;
        }

        console.log(`     📖  ${lesson.title}`);
      }

      console.log(`  ✅  ${topic.name} (${difficulty}) — ${lessons.length} lesson(s)`);
    }

    await client.query('COMMIT');

    console.log('');
    console.log('──────────────────────────────────────────────────────────');
    console.log(`  🎉  Seed complete!`);
    console.log(`      ${Object.keys(categories).length} categories`);
    console.log(`      ${topicCount} topics`);
    console.log(`      ${lessonCount} lessons`);
    console.log(`      ${exampleCount} code examples`);
    console.log(`      ${quizCount} quiz questions`);
    console.log('──────────────────────────────────────────────────────────');
    console.log('');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n  ❌  Seed failed:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
