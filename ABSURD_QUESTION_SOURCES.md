# Deep research: sources for absurd, workplace-safe questions

**Audience:** The Absurdity Feed maintainer  
**Date:** 5 September 2026  
**Decision:** How to add outside questions without allowing trivia, facts, offensive
material, fragile integrations, or unclear reuse rights onto an unattended office
monitor.

## Executive answer

Do not stream Reddit or scrape blogs directly onto the monitor. The best fit is a
**reviewed local library**: use workplace-oriented collections for topic discovery,
write or adapt original questions, review every entry once, and ship the approved
JSON with the page. The existing procedural generator can remain the infinite
fallback.

If a live API is still desired, TinyFn's Would You Rather endpoint is the closest
technical fit, but it requires an API key and backend proxy. Its own page claims
general-audience, workplace-appropriate output. It is not a drop-in choice for this
static page: exposing its key in browser JavaScript would be insecure, its free tier
is only 100 calls per month, and its questions are binary dilemmas rather than the
site's current open-ended absurdities.

## Source assessment

### 1. Reddit — reject for the live feed

Reddit has abundant material in communities such as AskReddit and
Showerthoughts, but a subreddit name, NSFW flag, score, or keyword filter cannot
guarantee that a specific title is suitable for an unattended workplace screen.
This would require human moderation before display.

The technical and policy fit is also poor. Reddit says non-commercial Data API
users must sign up, authenticated access information must be used, traffic without
OAuth/login may be blocked, and deleted content must also be deleted from retained
copies. Its current terms say employer/entity acceptance requires authority to bind
that entity and uses outside expressly permitted cases may require a separate
agreement. Reddit has also announced a gradual move of third-party apps toward its
Developer Platform. Sources:

- [Reddit Data API Terms](https://redditinc.com/policies/data-api-terms), revised
  20 July 2026
- [Developer Platform and Accessing Reddit Data](https://support.reddithelp.com/hc/en-us/articles/14945211791892-Developer-Platform-Accessing-Reddit-Data), updated 28 May 2026
- [Reddit Data API Wiki](https://support.reddithelp.com/hc/en-us/articles/16160319875092-Reddit-Data-API-Wiki)
- [Reddit's public-API transition announcement](https://www.reddit.com/r/redditdev/comments/1vgbm9c/our_plans_for_the_future_of_reddits_public_data/), August 2026

**Conclusion:** Reddit can be a manual discovery source, but not an automatic
unreviewed source for this screen.

### 2. Workplace-question blogs — best inspiration, not a feed

[teambuilding.com's unusual icebreakers](https://teambuilding.com/blog/unusual-icebreaker-questions)
are unusually close to the desired tone: surreal prompts involving living
vegetables, extra arms, office supplies, and invented tea flavors. Its broader
[icebreaker guide](https://teambuilding.com/blog/icebreaker-questions) explicitly
recommends avoiding protected or overly personal topics and favors open-ended
questions for conversation. That is a useful editorial standard for this project.

[Parabol's collection](https://www.parabol.co/resources/icebreaker-questions/)
also explicitly presents its questions as inclusive, without right or wrong
answers, and unlikely to make participants feel inadequate. It has a work-specific
section, though much of it is personal rather than absurd.

[Conversation Starters World](https://conversationstartersworld.com/random-question-generator/)
has more than 5,000 questions, but its publisher warns that the pool mixes serious
and light content. It offers a webpage generator, not a documented content API or
clear redistribution license.

These pages are copyrighted editorial works. Parabol's published terms retain
proprietary rights and prohibit copying or exploiting service content without
permission. No suitable bulk-reuse license was found for the blog collections.

**Conclusion:** use their categories and safety principles as inspiration. Do not
scrape, hotlink, or bulk-copy their wording. Ask the publisher for permission if
verbatim reuse is desired.

### 3. TinyFn Would You Rather API — viable only with a backend

[TinyFn documents](https://tinyfn.io/tools/fun/would-you-rather) a structured
`GET /v1/fun/would-you-rather` endpoint and says its output is designed for general
audiences, workplaces, and education. It requires an `X-API-Key`. Its
[published limits](https://tinyfn.io/docs/guides/rate-limits) show 100 requests per
month on the free tier and 10 requests per minute.

At one change every three minutes during an eight-hour workday, the display could
use about 160 questions per day, so the free tier is not adequate for a live-only
feed. A browser must not contain a reusable secret, so this option also requires a
small local or hosted backend and caching. Published paid prices were inconsistent
between the product and documentation pages at research time, so price should be
confirmed before adoption.

**Conclusion:** the best actual API found, but more machinery and cost than this
tiny display warrants. Its binary “Would you rather” format should be only one
category, not the whole feed.

### 4. Open-source question bank — useful supplement after review

The [YAGPDB Would You Rather package](https://pkg.go.dev/github.com/botlabs-gg/yagpdb/v2/stdcommands/wouldyourather)
contains 367 question pairs and is published as a versioned MIT-licensed Go module.
This is materially better for redistribution and offline reliability than copying
a blog. However, the package does not advertise a workplace-safety classification,
and binary dilemmas are not identical to this site's absurd-question style.

**Conclusion:** potentially import a manually approved subset, retain the MIT
license and attribution, and never fetch unreviewed updates straight onto the
monitor.

### 5. Truth-or-dare and trivia APIs — reject

The public [Truth or Dare API](https://docs.truthordarebot.xyz/api-docs) exposes
rating parameters, including PG, and a Would You Rather endpoint. Its examples are
often interpersonal rather than absurd, and a broad rating is not enough to meet a
strict office standard. Documentation paths were also inconsistent during review.

[Open Trivia DB](https://opentdb.com/api_config.php) is a well-documented free API,
but it serves answerable trivia. It does not satisfy the requirement for absurd,
open-ended questions. Random Useless Facts has the same category mismatch.

## Recommended implementation

1. Keep all displayed content local and pre-approved.
2. Move questions into a small `questions.json` file with `text`, `source`, and
   `approved` fields.
3. Add 100–200 original questions modeled on the strongest editorial categories:
   impossible office policies, object consciousness, animal bureaucracy, language
   paradoxes, food taxonomy, tiny inconveniences, and harmless cosmic logistics.
4. Optionally add a separately labeled, manually reviewed YAGPDB subset and retain
   its MIT attribution.
5. Keep the procedural generator as the post-bank fallback, but expand its templates
   and review every word list.
6. If future submissions are allowed, place them in a pending file; never display a
   submission until a person approves it.

This design is offline, deterministic in safety, cheap, legally clearer, and much
less likely to surprise colleagues than any unmoderated live source.

## Limitations and stopping point

“Safe for work” is contextual; no external provider can guarantee fit for every
company or culture. This review verified current first-party access terms and API
documentation where available and compared representative content from the leading
workplace-oriented collections. Search results for generic question datasets were
mostly trivia, research corpora, unlicensed scrapes, or adult-leaning party games;
additional broad searching was unlikely to change the recommendation.
