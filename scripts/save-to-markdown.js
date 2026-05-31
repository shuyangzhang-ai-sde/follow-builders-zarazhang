#!/usr/bin/env node

// Reads JSON from stdin (output of prepare-digest.js)
// Groups tweets by their actual posting date (CT) and appends each group
// to the correct weekly markdown file in ~/follow-ai-builders/

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const DIGEST_DIR = join(homedir(), 'follow-ai-builders');
const TZ = 'America/Chicago';

function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return {
    year: d.getUTCFullYear(),
    week: Math.ceil((((d - yearStart) / 86400000) + 1) / 7),
  };
}

// Returns a CT-local Date from a UTC ISO string
function toCTDate(isoString) {
  if (!isoString) return null;
  // Use Intl to extract CT date parts
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date(isoString));
  const p = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return new Date(`${p.year}-${p.month}-${p.day}T00:00:00`);
}

function formatDateKey(localDate) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[localDate.getMonth()]} ${localDate.getDate()}, ${localDate.getFullYear()} (${days[localDate.getDay()]})`;
}

function formatTweetTime(isoString) {
  if (!isoString) return null;
  return new Date(isoString).toLocaleString('en-US', {
    timeZone: TZ,
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  }) + ' CT';
}

function getWeekBounds(year, week) {
  // Find the Monday of the given ISO week
  const jan4 = new Date(year, 0, 4);
  const day = jan4.getDay() || 7;
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - (day - 1) + (week - 1) * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { monday, sunday };
}

function shortDate(date) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

function weekFile(localDate) {
  const { year, week } = getISOWeek(localDate);
  const weekStr = `W${String(week).padStart(2, '0')}`;
  const { monday, sunday } = getWeekBounds(year, week);
  const range = `${shortDate(monday)}–${shortDate(sunday)}`;
  return { path: join(DIGEST_DIR, `${year}-${weekStr} (${range}).md`), year, weekStr, range };
}

function appendToFile(filePath, year, weekStr, range, dateHeader, section) {
  mkdirSync(DIGEST_DIR, { recursive: true });

  let content = '';
  if (existsSync(filePath)) {
    content = readFileSync(filePath, 'utf-8');
    if (content.includes(`## ${dateHeader}`)) {
      // Section exists — skip to avoid duplicates
      return false;
    }
  } else {
    content = `# AI Builders Digest — ${year} ${weekStr} (${range})\n\n`;
  }

  writeFileSync(filePath, content + section, 'utf-8');
  return true;
}

async function main() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;

  const data = JSON.parse(input);
  const { x = [], podcasts = [], blogs = [] } = data;

  // --- Group tweets by CT calendar date ---
  // byDate: { dateKey -> { localDate, builders: { name -> { meta, tweets[] } } } }
  const byDate = {};

  for (const builder of x) {
    for (const tweet of (builder.tweets || [])) {
      const localDate = toCTDate(tweet.createdAt);
      if (!localDate) continue;
      const key = formatDateKey(localDate);
      if (!byDate[key]) byDate[key] = { localDate, builders: {}, podcasts: [], blogs: [] };
      if (!byDate[key].builders[builder.name]) {
        byDate[key].builders[builder.name] = { name: builder.name, bio: builder.bio, tweets: [] };
      }
      byDate[key].builders[builder.name].tweets.push(tweet);
    }
  }

  // --- Group podcasts by publishedAt date (fall back to today CT) ---
  const todayCT = toCTDate(new Date().toISOString());
  for (const podcast of podcasts) {
    const localDate = podcast.publishedAt ? toCTDate(podcast.publishedAt) : todayCT;
    const key = formatDateKey(localDate);
    if (!byDate[key]) byDate[key] = { localDate, builders: {}, podcasts: [], blogs: [] };
    byDate[key].podcasts.push(podcast);
  }

  // --- Group blog posts similarly ---
  for (const post of blogs) {
    const localDate = post.publishedAt ? toCTDate(post.publishedAt) : todayCT;
    const key = formatDateKey(localDate);
    if (!byDate[key]) byDate[key] = { localDate, builders: {}, podcasts: [], blogs: [] };
    byDate[key].blogs.push(post);
  }

  if (Object.keys(byDate).length === 0) {
    console.error('No content to save.');
    process.exit(0);
  }

  // --- Write each date group to its weekly file ---
  const results = [];

  const sortedDates = Object.entries(byDate).sort((a, b) => a[1].localDate - b[1].localDate);

  for (const [dateKey, { localDate, builders, podcasts: pods, blogs: bls }] of sortedDates) {
    let md = `## ${dateKey}\n\n`;

    const builderList = Object.values(builders);
    if (builderList.length > 0) {
      md += `### X / Twitter\n\n`;
      for (const builder of builderList) {
        md += `**${builder.name}**`;
        if (builder.bio) md += ` — ${builder.bio}`;
        md += `\n\n`;
        for (const tweet of builder.tweets) {
          const text = tweet.text?.trim().replace(/\n/g, '\n> ') || '';
          const time = formatTweetTime(tweet.createdAt);
          md += `> ${text}\n`;
          if (tweet.url) md += `>\n> ${tweet.url}\n`;
          if (time) md += `> *${time}*\n`;
          md += `\n`;
        }
      }
    }

    if (pods.length > 0) {
      md += `### Podcasts\n\n`;
      for (const podcast of pods) {
        md += `**${podcast.name}** — ${podcast.title}\n`;
        if (podcast.url) md += `${podcast.url}\n`;
        md += `\n`;
      }
    }

    if (bls.length > 0) {
      md += `### Blogs\n\n`;
      for (const post of bls) {
        md += `**${post.source || post.name}** — ${post.title}\n`;
        if (post.url) md += `${post.url}\n`;
        md += `\n`;
      }
    }

    md += `---\n\n`;

    const { path: filePath, year, weekStr, range } = weekFile(localDate);
    const written = appendToFile(filePath, year, weekStr, range, dateKey, md);
    results.push({ date: dateKey, file: filePath, written });
  }

  console.log(JSON.stringify({ status: 'ok', results }));
}

main().catch(err => {
  console.error(JSON.stringify({ status: 'error', message: err.message }));
  process.exit(1);
});
