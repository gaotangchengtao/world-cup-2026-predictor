"""Safely collect public metadata for World Cup off-field stories.

This script is intentionally conservative:
- allowlisted public domains only
- robots.txt check before each fetch
- low request rate
- no login, no paywall bypass, no anti-bot evasion
- stores metadata, not full article bodies

The curated summaries used by the React app still require manual review.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import time
import urllib.parse
import urllib.request
import urllib.robotparser
from pathlib import Path


DEFAULT_OUTPUT_DIR = Path(r"D:\世界杯场外花絮")
USER_AGENT = "WorldCupIntelligenceCenter/0.1 (public metadata; low-rate; manual review)"
REQUEST_DELAY_SECONDS = 2.5
MAX_BYTES = 500_000

ALLOWED_DOMAINS = {
    "apnews.com",
    "inside.fifa.com",
    "fifa.com",
    "www.fifa.com",
    "espn.com",
    "www.espn.com",
    "bbc.com",
    "www.bbc.com",
    "skysports.com",
    "www.skysports.com",
}

SEED_URLS = [
    {
        "id": "transit-costs-host-cities",
        "source": "AP News",
        "url": "https://apnews.com/article/world-cup-transit-new-jersey-boston-prices-f66d51bf1ed1de1bf568ac4fd319b8f8",
    },
    {
        "id": "iran-base-camp-mexico",
        "source": "AP News",
        "url": "https://apnews.com/article/iran-world-cup-mexico-5bdfa21feccf35f0ed955b9dd1ab7244",
    },
    {
        "id": "heat-protocols-player-letter",
        "source": "AP News",
        "url": "https://apnews.com/article/world-cup-heat-players-fifa-1a5252346f1f7981c6bf189b7231fcbf",
    },
    {
        "id": "accessibility-sign-language-haptic",
        "source": "FIFA",
        "url": "https://inside.fifa.com/organisation/news/accessibility-world-cup-2026-disability-social-inclusion",
    },
    {
        "id": "final-halftime-show",
        "source": "AP News",
        "url": "https://apnews.com/article/world-cup-final-halftime-show-f08a3cc88e5c1dfccf0517941458df2f",
    },
    {
        "id": "fifa-financial-distribution",
        "source": "FIFA",
        "url": "https://inside.fifa.com/organisation/fifa-council/media-releases/council-increases-record-financial-distribution-member-associations-world-cup-2026",
    },
]


def domain_for(url: str) -> str:
    return urllib.parse.urlparse(url).netloc.lower().removeprefix("www.")


def is_allowed(url: str) -> bool:
    parsed = urllib.parse.urlparse(url)
    domain = parsed.netloc.lower()
    return domain in ALLOWED_DOMAINS or domain.removeprefix("www.") in ALLOWED_DOMAINS


def robots_url(url: str) -> str:
    parsed = urllib.parse.urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}/robots.txt"


def robots_allows(url: str) -> bool:
    parser = urllib.robotparser.RobotFileParser()
    parser.set_url(robots_url(url))
    try:
        parser.read()
    except Exception:
        return False
    return parser.can_fetch(USER_AGENT, url)


def extract_meta(html: str, pattern: str) -> str | None:
    match = re.search(pattern, html, flags=re.IGNORECASE | re.DOTALL)
    if not match:
        return None
    return re.sub(r"\s+", " ", match.group(1)).strip()


def fetch_metadata(item: dict[str, str]) -> dict[str, object]:
    url = item["url"]
    record: dict[str, object] = {
        **item,
        "fetchedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
        "allowedDomain": is_allowed(url),
        "robotsAllowed": False,
        "status": None,
        "title": None,
        "description": None,
        "finalUrl": None,
        "error": None,
    }

    if not record["allowedDomain"]:
        record["error"] = "Domain is not allowlisted."
        return record

    if not robots_allows(url):
        record["error"] = "robots.txt does not allow this fetch or could not be read."
        return record

    record["robotsAllowed"] = True
    request = urllib.request.Request(
        url,
        headers={
            "Accept": "text/html,application/xhtml+xml",
            "User-Agent": USER_AGENT,
        },
    )

    try:
        with urllib.request.urlopen(request, timeout=12) as response:
            payload = response.read(MAX_BYTES + 1)
            charset = response.headers.get_content_charset() or "utf-8"
            html = payload[:MAX_BYTES].decode(charset, errors="replace")
            record["status"] = getattr(response, "status", None)
            record["finalUrl"] = response.geturl()
            record["title"] = extract_meta(html, r"<title[^>]*>(.*?)</title>")
            record["description"] = extract_meta(
                html,
                r'<meta[^>]+(?:name|property)=["\'](?:description|og:description)["\'][^>]+content=["\']([^"\']+)["\']',
            )
            record["truncated"] = len(payload) > MAX_BYTES
    except Exception as exc:
        record["error"] = f"{type(exc).__name__}: {exc}"

    return record


def main() -> None:
    parser = argparse.ArgumentParser(description="Fetch safe public metadata for off-field World Cup stories.")
    parser.add_argument("--output-dir", default=str(DEFAULT_OUTPUT_DIR), help="Folder for raw metadata output.")
    args = parser.parse_args()

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    results = []
    for index, item in enumerate(SEED_URLS):
        if index:
            time.sleep(REQUEST_DELAY_SECONDS)
        results.append(fetch_metadata(item))

    output_path = output_dir / "off_field_story_fetch_log.json"
    output_path.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {output_path}")


if __name__ == "__main__":
    main()
