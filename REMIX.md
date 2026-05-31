# Remix: Local Markdown Archive

**Original project:** [follow-builders](https://github.com/zarazhangrui/follow-builders) by Zara Zhang
**This fork adds:** automatic daily archiving of digests to local Markdown files

## 1. New features at a glance

**Storage**
- **Local Markdown archive** — digests are saved to `~/follow-ai-builders/` instead of sent via Telegram
- **Weekly files with date ranges** — one file per ISO week, named `2026-W22 (May 25–May 31).md` for easy browsing
- **Daily sections** — each day's content appears under its own `## Date` heading within the weekly file

**Content**
- **Accurate date attribution** — tweets are filed under their actual posting date (CT), not the date the script runs
- **Tweet timestamps** — each tweet shows its posting time in CT
- **Chronological ordering** — date sections are always written oldest-first within a file

**Reliability**
- **Idempotent writes** — running the script twice on the same day won't produce duplicate sections
- **3am CT pull** — runs at 8am UTC, right after Zara's central feed updates (7–8am UTC / 2–3am CT, based on git history)

**Distribution**
- **Renamed skill** — skill name changed from `follow-builders` to `follow-builders-local` to avoid conflicts with Zara's original when both are installed

---

## 2. What the original does

`follow-builders` is a Claude Code skill that tracks 26 AI builders on X and 6 podcasts. It fetches content from a centralized feed (no API keys required) and delivers a daily digest — remixed by an LLM — via Telegram, email, or on-demand in the terminal.

## 3. What this remix changes

Instead of sending the digest to Telegram, email or terminal, each daily digest is appended as a new section to a weekly Markdown file stored locally at `~/follow-ai-builders/`.

### 3.1 File structure

```
~/follow-ai-builders/
  2026-W22 (May 25–May 31).md
  2026-W23 (Jun 1–Jun 7).md
  ...
```

Each filename includes the ISO week number and the Monday–Sunday date range, so the right file is easy to locate without opening it. Each file covers one ISO week and contains a `## Date` section per day:

```markdown
# AI Builders Digest — 2026 W22 (May 25–May 31)

## May 30, 2026 (Saturday)

### X / Twitter

**Boris Cherny** — Claude Code @anthropicai
> The teams seeing the biggest wins...
>
> https://x.com/bcherny/status/...
> *May 29, 11:00 AM CT*

### Podcasts

**No Priors** — Building an AI Guardian for Enterprise
https://www.youtube.com/watch?v=...

---
```

## 4. What was changed

### 4.1 New file: `scripts/save-to-markdown.js`

Reads the JSON output of `prepare-digest.js` from stdin and appends a formatted Markdown section to the current week's file. Features:

- Determines the correct weekly file using ISO week numbering
- Creates the `~/follow-ai-builders/` directory if it doesn't exist
- Skips writing if the current day's section already exists (idempotent)
- Formats tweets as blockquotes with source URLs
- Displays each tweet's posting time (converted from UTC to US Central Time), using the `createdAt` field already present in the original feed data
- Groups content by actual posting date (`createdAt` in CT) rather than the date the script runs, so each day's file only contains content posted on that calendar day
- Sorts date sections chronologically before writing, regardless of the order builders appear in the feed

### 4.2 Updated: crontab

New (Markdown archive, runs at 3am CT):
```
0 3 * * * cd .../scripts && node prepare-digest.js | node save-to-markdown.js
```

### 4.3 Updated: `~/.follow-builders/config.json`

Removed `telegram` delivery method and bot credentials. Delivery method is now `file`.

### 4.4 Removed: `~/.follow-builders/.env`

Telegram bot token is no longer needed and has been deleted.

### 4.5 Updated: `SKILL.md`

Skill name changed from `follow-builders` to `follow-builders-local`. This allows both this remix and Zara's original to be installed side by side without conflict.

## 5. Understanding Zara's Design

### 5.1 Builder ordering

The order builders appear in each digest is neither alphabetical nor sorted by tweet recency. The actual logic is: builders are listed in the order they appear in `config/default-sources.json`, but only those who have new tweets that day are included.

For example, if a day's digest shows Josh Woodward → Boris Cherny → Aaron Levie, it means builders listed before them in `default-sources.json` (like Karpathy, Swyx, etc.) had no new content that day and were skipped.

This order is defined centrally by Zara in `default-sources.json` and cannot be customized by users.

### 5.2 Feed update cadence and date attribution

Based on the repo's git history, the central feed updates daily at approximately 7–8am UTC (2–3am CT). Pulling at 3am CT (8am UTC) is reliably after that update.

Each tweet is saved under its actual posting date (`createdAt` in CT) rather than the date the script runs. The goal is simple: content posted on May 30 should appear in the May 30 section, not wherever it happens to land based on when the script runs.

---

## 6. Why

The goal is a persistent, searchable local archive — no messaging app required, no dependency on Telegram staying configured. The weekly Markdown files can be opened in any editor, synced via iCloud or Git, and reviewed at any time without re-triggering the skill.

The tradeoff: since the cron job runs without the LLM, the archived content is the raw tweet text and podcast metadata rather than an AI-remixed summary. To get the remixed version, run `/follow-builders` manually in Claude Code.
