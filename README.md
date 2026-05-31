**English** | [中文](README.zh-CN.md)

# follow-builders-local

> A remix of [follow-builders](https://github.com/zarazhangrui/follow-builders) by [Zara Zhang](https://github.com/zarazhangrui).
> The original skill delivers AI builder digests via Telegram, email, or in-chat.
> This remix saves them as local Markdown files instead.

## What this remix adds

**Storage**
- Digests are saved to `~/follow-ai-builders/` as weekly Markdown files — no Telegram or messaging app needed
- Weekly files are named with date ranges: `2026-W22 (May 25–May 31).md`
- Each day's content appears under its own `## Date` heading within the weekly file

**Content**
- Tweets are filed under their actual posting date (CT), not the date the script runs
- Each tweet shows its posting time in CT
- Date sections are written in chronological order within each file

**Reliability**
- Running the script twice on the same day won't produce duplicate sections
- Pulls at 3am CT, right after Zara's central feed updates (~2am CT)

**Distribution**
- Skill renamed to `follow-builders-local` to avoid conflicts with the original when both are installed

For full details, see [REMIX.md](REMIX.md).

---

*Everything below is from Zara's original README, updated where this remix differs.*

---

## What You Get

A daily digest saved to `~/follow-ai-builders/` as a local Markdown archive, containing:

- Summaries of new podcast episodes from top AI podcasts
- Key posts and insights from 26 curated AI builders on X/Twitter, with timestamps
- Full articles from official AI company blogs (Anthropic Engineering, Claude Blog)
- Links to all original content

## Quick Start

```bash
git clone https://github.com/shuyangzhang/follow-builders-local.git ~/.claude/skills/follow-builders-local
cd ~/.claude/skills/follow-builders-local/scripts && npm install
```

Then in Claude Code, invoke `/follow-builders-local`. The agent will walk you through setup.

No API keys needed — all content is fetched centrally. Your first digest is saved immediately after setup.

## How It Works

1. A central feed (maintained by Zara) is updated daily at approximately 7–8am UTC (2–3am CT), based on the repo's git history — blog articles via web scraping, YouTube transcripts via Supadata, X/Twitter via official API
2. At 3am CT (8am UTC), a cron job fetches the feed (one HTTP request, no API keys)
3. Content is grouped by actual posting date and appended to the weekly Markdown file in `~/follow-ai-builders/`
4. To get an LLM-remixed summary instead of raw content, run `/follow-builders-local` manually in Claude Code at any time

See [examples/sample-digest.md](examples/sample-digest.md) for what the output looks like.

## Customizing the Summaries

*(From Zara's original — unchanged in this remix)*

The skill uses plain-English prompt files to control how content is summarized. You can customize them two ways:

**Through conversation (recommended):**
Tell your agent what you want — "Make summaries more concise," "Focus on actionable insights," "Use a more casual tone." The agent updates the prompts for you.

**Direct editing (power users):**
Edit the files in the `prompts/` folder:
- `summarize-podcast.md` — how podcast episodes are summarized
- `summarize-tweets.md` — how X/Twitter posts are summarized
- `summarize-blogs.md` — how blog posts are summarized
- `digest-intro.md` — the overall digest format and tone
- `translate.md` — how English content is translated to Chinese

These are plain English instructions, not code. Changes take effect on the next digest.

## Default Sources

*(From Zara's original — the source list is curated and updated centrally by Zara)*

### Podcasts (6)
- [Latent Space](https://www.youtube.com/@LatentSpacePod)
- [Training Data](https://www.youtube.com/playlist?list=PLOhHNjZItNnMm5tdW61JpnyxeYH5NDDx8)
- [No Priors](https://www.youtube.com/@NoPriorsPodcast)
- [Unsupervised Learning](https://www.youtube.com/@RedpointAI)
- [The MAD Podcast with Matt Turck](https://www.youtube.com/@DataDrivenNYC)
- [AI & I by Every](https://www.youtube.com/playlist?list=PLuMcoKK9mKgHtW_o9h5sGO2vXrffKHwJL)

### AI Builders on X (26)
[Andrej Karpathy](https://x.com/karpathy), [Swyx](https://x.com/swyx), [Josh Woodward](https://x.com/joshwoodward), [Boris Cherny](https://x.com/bcherny), [Thibault Sottiaux](https://x.com/thsottiaux), [Peter Yang](https://x.com/petergyang), [Nan Yu](https://x.com/thenanyu), [Madhu Guru](https://x.com/realmadhuguru), [Amanda Askell](https://x.com/AmandaAskell), [Cat Wu](https://x.com/_catwu), [Thariq](https://x.com/trq212), [Google Labs](https://x.com/GoogleLabs), [Amjad Masad](https://x.com/amasad), [Guillermo Rauch](https://x.com/rauchg), [Alex Albert](https://x.com/alexalbert__), [Aaron Levie](https://x.com/levie), [Ryo Lu](https://x.com/ryolu_), [Garry Tan](https://x.com/garrytan), [Matt Turck](https://x.com/mattturck), [Zara Zhang](https://x.com/zarazhangrui), [Nikunj Kothari](https://x.com/nikunj), [Peter Steinberger](https://x.com/steipete), [Dan Shipper](https://x.com/danshipper), [Aditya Agarwal](https://x.com/adityaag), [Sam Altman](https://x.com/sama), [Claude](https://x.com/claudeai)

### Official Blogs (2)
- [Anthropic Engineering](https://www.anthropic.com/engineering) — technical deep-dives from the Anthropic team
- [Claude Blog](https://claude.com/blog) — product announcements and updates from Claude

## Requirements

- Claude Code
- Internet connection (to fetch the central feed)

No API keys needed. All content is fetched centrally and updated daily by Zara's service.

## License

MIT
