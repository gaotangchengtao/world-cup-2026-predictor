"""Refresh the World Cup squad, tournament stats, and official player photos.

Sources:
- FIFA final squad-list PDF saved at data/raw/SquadLists-English.pdf
- FIFA's public GameDay statistics API used by fifa.com

The script uses a small worker pool, retries transient failures, and never
attempts to bypass authentication, rate limits, or anti-bot protections.
"""

from __future__ import annotations

import argparse
import io
import json
import re
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date, datetime, timezone
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any

import pdfplumber
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / "data" / "raw"
SQUAD_PDF = RAW_DIR / "SquadLists-English.pdf"
SQUAD_OUTPUT = ROOT / "src" / "data" / "officialSquads.json"
STATS_OUTPUT = ROOT / "src" / "data" / "playerTournamentStats.json"
RAW_STATS_OUTPUT = RAW_DIR / "fifa-player-stats-snapshot.json"
DREAM_PLAYERS_INPUT = RAW_DIR / "fifa-dream-players.json"
PHOTO_DIR = ROOT / "public" / "assets" / "players"

TOKEN_URL = "https://cxm-api.fifa.com/fifaplusweb/api/external/gameDay/token"
GAMEDAY_BASE = "https://gameday-prod.fifa.mangodev.co.uk/1-0"
SQUAD_SOURCE_URL = "https://fdp.fifa.org/assetspublic/ce281/pdf/SquadLists-English.pdf"
STATS_SOURCE_URL = (
    "https://www.fifa.com/en/tournaments/mens/worldcup/"
    "canadamexicousa2026/statistics/player-statistics"
)
COMPETITION_ID = "285023"
USER_AGENT = "WorldCupPredictor/1.0 (+https://github.com/gaotangchengtao/world-cup-2026-predictor)"

STAT_GROUPS = (
    "gcp_top_scorer",
    "gcp_attack",
    "gcp_distribution",
    "gcp_defending",
    "gcp_discipline",
    "gcp_goalkeeping",
    "gcp_movement",
    "gcp_physical",
)

TEAM_ID_BY_CODE = {
    "ALG": "algeria",
    "ARG": "argentina",
    "AUS": "australia",
    "AUT": "austria",
    "BEL": "belgium",
    "BIH": "bosnia-herzegovina",
    "BRA": "brazil",
    "CPV": "cape-verde",
    "CAN": "canada",
    "COL": "colombia",
    "COD": "dr-congo",
    "CIV": "cote-divoire",
    "CRO": "croatia",
    "CUW": "curacao",
    "CZE": "czechia",
    "ECU": "ecuador",
    "EGY": "egypt",
    "ENG": "england",
    "FRA": "france",
    "GER": "germany",
    "GHA": "ghana",
    "HAI": "haiti",
    "IRN": "iran",
    "IRQ": "iraq",
    "JPN": "japan",
    "JOR": "jordan",
    "KOR": "south-korea",
    "MEX": "mexico",
    "MAR": "morocco",
    "NED": "netherlands",
    "NZL": "new-zealand",
    "NOR": "norway",
    "PAN": "panama",
    "PAR": "paraguay",
    "POR": "portugal",
    "QAT": "qatar",
    "KSA": "saudi-arabia",
    "SCO": "scotland",
    "SEN": "senegal",
    "RSA": "south-africa",
    "ESP": "spain",
    "SWE": "sweden",
    "SUI": "switzerland",
    "TUN": "tunisia",
    "TUR": "turkiye",
    "URU": "uruguay",
    "USA": "usa",
    "UZB": "uzbekistan",
}


def request_json(url: str, headers: dict[str, str] | None = None, retries: int = 4) -> Any:
    request_headers = {"Accept": "application/json", "User-Agent": USER_AGENT}
    request_headers.update(headers or {})
    for attempt in range(retries):
        try:
            request = urllib.request.Request(url, headers=request_headers)
            with urllib.request.urlopen(request, timeout=60) as response:
                return json.load(response)
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError):
            if attempt == retries - 1:
                raise
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"Unable to fetch {url}")


def story_tags(item: dict[str, Any]) -> dict[str, Any]:
    return {tag["name"]: tag.get("value") for tag in item.get("tags", [])}


def actor_tags(actor: dict[str, Any]) -> dict[str, Any]:
    return {tag["name"]: tag.get("value") for tag in actor.get("tags", [])}


def fetch_stats_snapshot() -> dict[str, dict[str, Any]]:
    token = request_json(TOKEN_URL)["token"]
    headers = {"Authorization": f"Bearer {token}"}
    actors: dict[str, dict[str, Any]] = {}
    raw_groups: dict[str, list[dict[str, Any]]] = {}

    for story_type in STAT_GROUPS:
        page = 1
        raw_groups[story_type] = []
        while True:
            external_id = (
                f"urn:gd:story:classification:{story_type}:competitionId:"
                f"{COMPETITION_ID}:(.*):rank_asc:page:{page}$"
            )
            query = (
                "(and resourceStatus==`urn:gd:resourceStatus:active` "
                f"_externalId~`{external_id}`)"
            )
            params = urllib.parse.urlencode(
                {
                    "query": query,
                    "skip": 0,
                    "limit": 1,
                    "sort": "tags.name==urn:gd:tag:story:fifa:column_number:asc",
                }
            )
            data = request_json(f"{GAMEDAY_BASE}/stories?{params}", headers=headers)
            if not data.get("items"):
                break

            item = data["items"][0]
            raw_groups[story_type].append(item)
            tags = story_tags(item)
            page_count = int(tags.get("urn:gd:tag:story:page_count", page))

            for actor in item.get("actors", []):
                fifa_id = str(actor.get("key", {}).get("_externalSportsPersonId", ""))
                if not fifa_id:
                    continue
                tags_by_name = actor_tags(actor)
                record = actors.setdefault(
                    fifa_id,
                    {
                        "fifaId": int(fifa_id),
                        "name": actor.get("name", {}).get("eng") or "",
                        "nameZh": actor.get("name", {}).get("zho") or "",
                        "teamCode": tags_by_name.get("urn:gd:tag:story:team:abbreviation", ""),
                        "position": tags_by_name.get("urn:gd:tag:story:staff:position", ""),
                        "photoOriginalUrl": tags_by_name.get("urn:gd:tag:story:staff:image"),
                        "stats": {},
                    },
                )
                if tags_by_name.get("urn:gd:tag:story:staff:image"):
                    record["photoOriginalUrl"] = tags_by_name["urn:gd:tag:story:staff:image"]
                for tag_name, value in tags_by_name.items():
                    marker = "urn:gd:tag:football:stats:"
                    if marker in tag_name:
                        record["stats"][tag_name.split(marker, 1)[1]] = value

            print(f"{story_type}: page {page}/{page_count}, {len(actors)} players")
            if page >= page_count:
                break
            page += 1
            time.sleep(0.12)

    RAW_DIR.mkdir(parents=True, exist_ok=True)
    RAW_STATS_OUTPUT.write_text(
        json.dumps(
            {
                "fetchedAt": datetime.now(timezone.utc).isoformat(),
                "competitionId": COMPETITION_ID,
                "groups": raw_groups,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    return actors


def normalized(value: str) -> str:
    value = unicodedata.normalize("NFKD", value or "")
    value = "".join(character for character in value if not unicodedata.combining(character))
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()


def similarity(left: str, right: str) -> float:
    left_normalized = normalized(left)
    right_normalized = normalized(right)
    if not left_normalized or not right_normalized:
        return 0.0
    left_tokens = set(left_normalized.split())
    right_tokens = set(right_normalized.split())
    token_score = len(left_tokens & right_tokens) / max(len(left_tokens | right_tokens), 1)
    sequence_score = SequenceMatcher(None, left_normalized, right_normalized).ratio()
    return max(token_score, sequence_score)


def age_on(date_of_birth: date, on_date: date = date(2026, 6, 11)) -> int:
    return on_date.year - date_of_birth.year - (
        (on_date.month, on_date.day) < (date_of_birth.month, date_of_birth.day)
    )


def strip_club_country(club: str) -> str:
    return re.sub(r"\s+\([A-Z]{3}\)$", "", club or "").strip()


def display_name_from_pdf(player_name: str) -> str:
    words = player_name.split()
    first_given_index = next(
        (index for index, word in enumerate(words) if word != word.upper()),
        None,
    )
    if first_given_index is None:
        return " ".join(word.title() for word in words)
    surname = " ".join(word.title() for word in words[:first_given_index])
    given_names = " ".join(words[first_given_index:])
    return " ".join(part for part in (given_names, surname) if part)


def parse_squads(stats_actors: dict[str, dict[str, Any]]) -> tuple[list[dict[str, Any]], dict[str, str]]:
    if not SQUAD_PDF.exists():
        raise FileNotFoundError(
            f"Missing {SQUAD_PDF}. Download the official FIFA squad PDF before running this script."
        )

    actors_by_fifa_id = {int(fifa_id): actor for fifa_id, actor in stats_actors.items()}
    dream_by_team: dict[str, list[dict[str, Any]]] = {}
    if DREAM_PLAYERS_INPUT.exists():
        dream_players = json.loads(DREAM_PLAYERS_INPUT.read_text(encoding="utf-8"))
        squad_team_votes: dict[int, dict[str, int]] = {}
        for dream_player in dream_players:
            actor = actors_by_fifa_id.get(int(dream_player.get("fifaId") or 0))
            if not actor or not actor.get("teamCode"):
                continue
            votes = squad_team_votes.setdefault(int(dream_player["squadId"]), {})
            team_code = actor["teamCode"]
            votes[team_code] = votes.get(team_code, 0) + 1
        squad_team = {
            squad_id: max(votes, key=votes.get)
            for squad_id, votes in squad_team_votes.items()
            if votes
        }
        for dream_player in dream_players:
            team_code = squad_team.get(int(dream_player["squadId"]))
            if team_code:
                dream_by_team.setdefault(team_code, []).append(dream_player)
        for actor in stats_actors.values():
            team_code = actor.get("teamCode")
            if not team_code:
                continue
            existing_ids = {
                int(candidate["fifaId"])
                for candidate in dream_by_team.get(team_code, [])
                if candidate.get("fifaId")
            }
            if actor["fifaId"] not in existing_ids:
                dream_by_team.setdefault(team_code, []).append(
                    {
                        "fifaId": actor["fifaId"],
                        "shortName": actor["name"],
                        "knownName": None,
                    }
                )
    else:
        for actor in stats_actors.values():
            dream_by_team.setdefault(actor["teamCode"], []).append(
                {
                    "fifaId": actor["fifaId"],
                    "shortName": actor["name"],
                    "knownName": None,
                }
            )

    used_fifa_ids: set[int] = set()
    squads: list[dict[str, Any]] = []
    coaches: dict[str, str] = {}

    with pdfplumber.open(SQUAD_PDF) as pdf:
        for page in pdf.pages:
            text_lines = (page.extract_text() or "").splitlines()
            team_line = text_lines[3] if len(text_lines) > 3 else ""
            code_match = re.search(r"\(([A-Z]{3})\)\s*$", team_line)
            if not code_match:
                raise ValueError(f"Could not identify team on PDF page: {team_line}")
            team_code = code_match.group(1)
            team_id = TEAM_ID_BY_CODE[team_code]
            rows = page.extract_tables()[0]

            for row in rows[1:]:
                row = list(row) + [None] * max(0, 15 - len(row))
                if row[0] == "ROLE":
                    continue
                if row[0] == "Head coach":
                    coach_values = [value for value in row if value not in (None, "")]
                    coach_first_names = coach_values[2] if len(coach_values) > 2 else ""
                    coach_last_names = coach_values[3] if len(coach_values) > 3 else ""
                    coaches[team_id] = " ".join(
                        part
                        for part in (
                            coach_first_names.split()[0] if coach_first_names else "",
                            coach_last_names.title(),
                        )
                        if part
                    )
                    continue
                if not (row[0] or "").isdigit():
                    continue

                values = [value for value in row if value not in (None, "")]
                if len(values) < 11:
                    raise ValueError(f"Unexpected player row on {team_code}: {row}")
                (
                    shirt_number_text,
                    position_text,
                    pdf_player_name,
                    first_names,
                    last_names,
                    name_on_shirt,
                    date_of_birth_text,
                    club_text,
                    height_text,
                    caps_text,
                    goals_text,
                ) = values[:11]
                shirt_number = int(shirt_number_text)
                date_of_birth = datetime.strptime(date_of_birth_text, "%d/%m/%Y").date()
                candidates = [
                    candidate
                    for candidate in dream_by_team.get(team_code, [])
                    if candidate.get("fifaId") and int(candidate["fifaId"]) not in used_fifa_ids
                ]
                variants = (
                    pdf_player_name,
                    f"{first_names} {last_names}",
                    f"{first_names.split()[0] if first_names else ''} {last_names}",
                    name_on_shirt,
                )
                best_actor = None
                best_score = 0.0
                for candidate in candidates:
                    candidate_name = candidate.get("knownName") or candidate.get("shortName") or ""
                    score = max(similarity(variant, candidate_name) for variant in variants)
                    if score > best_score:
                        best_actor = candidate
                        best_score = score
                if best_score < 0.75:
                    best_actor = None

                if best_actor:
                    fifa_id = int(best_actor["fifaId"])
                    used_fifa_ids.add(fifa_id)
                    actor = actors_by_fifa_id.get(fifa_id, {})
                    display_name = (
                        best_actor.get("knownName")
                        or best_actor.get("shortName")
                        or actor.get("name")
                        or ""
                    )
                    name_zh = actor.get("nameZh") or ""
                    photo_original_url = actor.get("photoOriginalUrl")
                    player_stats = actor.get("stats", {})
                else:
                    fifa_id = None
                    display_name = display_name_from_pdf(pdf_player_name)
                    name_zh = ""
                    photo_original_url = None
                    player_stats = {}

                player_id_suffix = str(fifa_id) if fifa_id else normalized(display_name).replace(" ", "-")
                position = {"GK": "GK", "DF": "DF", "MF": "MF", "FW": "FW"}[position_text]
                squads.append(
                    {
                        "playerId": f"{team_id}-{player_id_suffix}",
                        "fifaId": fifa_id,
                        "teamId": team_id,
                        "teamCode": team_code,
                        "name": display_name,
                        "nameZh": name_zh if normalized(name_zh) != normalized(display_name) else "",
                        "position": position,
                        "dateOfBirth": date_of_birth.isoformat(),
                        "age": age_on(date_of_birth),
                        "club": strip_club_country(club_text),
                        "heightCm": int(height_text) if height_text.isdigit() else None,
                        "internationalCaps": int(caps_text) if caps_text.isdigit() else None,
                        "internationalGoals": int(goals_text) if goals_text.isdigit() else None,
                        "shirtNumber": shirt_number,
                        "photoOriginalUrl": photo_original_url,
                        "photoUrl": f"assets/players/{fifa_id}.webp" if photo_original_url and fifa_id else None,
                        "stats": player_stats,
                    }
                )

    unmatched = [player for player in squads if player["fifaId"] is None]
    print(f"Parsed {len(squads)} players; matched {len(squads) - len(unmatched)} FIFA IDs")
    if unmatched:
        print("Unmatched:", ", ".join(f"{player['teamCode']}:{player['name']}" for player in unmatched))
    return squads, coaches


def download_photo(player: dict[str, Any], overwrite: bool) -> tuple[str, bool, str]:
    fifa_id = player.get("fifaId")
    original_url = player.get("photoOriginalUrl")
    if not fifa_id or not original_url:
        return player["playerId"], False, "missing source URL"

    destination = PHOTO_DIR / f"{fifa_id}.webp"
    if destination.exists() and destination.stat().st_size > 500 and not overwrite:
        return player["playerId"], True, "cached"

    params = urllib.parse.urlencode({"io": "transform:fill,width:192,height:192", "quality": 78})
    url = f"{original_url}?{params}"
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "image/*"})
    try:
        with urllib.request.urlopen(request, timeout=45) as response:
            image_bytes = response.read(2_500_000)
        with Image.open(io.BytesIO(image_bytes)) as image:
            image = image.convert("RGB")
            image.thumbnail((192, 192), Image.Resampling.LANCZOS)
            canvas = Image.new("RGB", (192, 192), (13, 28, 54))
            canvas.paste(image, ((192 - image.width) // 2, (192 - image.height) // 2))
            canvas.save(destination, "WEBP", quality=78, method=4)
        return player["playerId"], True, "downloaded"
    except (urllib.error.URLError, TimeoutError, OSError) as error:
        return player["playerId"], False, str(error)


def download_photos(squads: list[dict[str, Any]], overwrite: bool) -> set[str]:
    PHOTO_DIR.mkdir(parents=True, exist_ok=True)
    downloaded: set[str] = set()
    failures: list[str] = []
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = {executor.submit(download_photo, player, overwrite): player for player in squads}
        for index, future in enumerate(as_completed(futures), start=1):
            player_id, success, message = future.result()
            if success:
                downloaded.add(player_id)
            else:
                failures.append(f"{player_id}: {message}")
            if index % 100 == 0 or index == len(futures):
                print(f"Photos: {index}/{len(futures)} processed, {len(downloaded)} available")
            time.sleep(0.02)
    if failures:
        (RAW_DIR / "player-photo-failures.txt").write_text("\n".join(failures), encoding="utf-8")
    return downloaded


def write_outputs(
    squads: list[dict[str, Any]],
    coaches: dict[str, str],
    available_photos: set[str],
) -> None:
    updated_at = datetime.now(timezone.utc).isoformat()
    squad_rows = []
    all_stat_keys = sorted(
        {
            stat_key
            for player in squads
            for stat_key in player.get("stats", {})
        }
    )
    stat_rows = []

    for player in squads:
        has_local_photo = player["playerId"] in available_photos
        squad_rows.append(
            {
                key: value
                for key, value in player.items()
                if key not in {"stats", "teamCode", "photoOriginalUrl", "photoSource"}
                and value not in (None, "")
            }
            | {
                "photoUrl": player["photoUrl"] if has_local_photo else None,
            }
        )
        stat_rows.append(
            {
                "playerId": player["playerId"],
                "fifaId": player.get("fifaId"),
                "teamId": player["teamId"],
                "values": [player.get("stats", {}).get(stat_key) for stat_key in all_stat_keys],
            }
        )

    SQUAD_OUTPUT.write_text(
        json.dumps(
            {
                "updatedAt": updated_at,
                "sourceUrl": SQUAD_SOURCE_URL,
                "statsSourceUrl": STATS_SOURCE_URL,
                "squadStatus": "final",
                "coaches": coaches,
                "players": squad_rows,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    STATS_OUTPUT.write_text(
        json.dumps(
            {
                "updatedAt": updated_at,
                "competitionId": COMPETITION_ID,
                "sourceUrl": STATS_SOURCE_URL,
                "dataQuality": "official",
                "metricKeys": all_stat_keys,
                "players": stat_rows,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"Wrote {SQUAD_OUTPUT.relative_to(ROOT)} and {STATS_OUTPUT.relative_to(ROOT)}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--skip-stats-fetch", action="store_true", help="Use the cached raw stats snapshot.")
    parser.add_argument("--skip-photos", action="store_true", help="Do not download player photos.")
    parser.add_argument("--overwrite-photos", action="store_true", help="Redownload existing photo files.")
    args = parser.parse_args()

    if args.skip_stats_fetch:
        if not RAW_STATS_OUTPUT.exists():
            raise FileNotFoundError(f"Missing cached stats file: {RAW_STATS_OUTPUT}")
        raw = json.loads(RAW_STATS_OUTPUT.read_text(encoding="utf-8"))
        actors: dict[str, dict[str, Any]] = {}
        for items in raw["groups"].values():
            for item in items:
                for actor in item.get("actors", []):
                    fifa_id = str(actor.get("key", {}).get("_externalSportsPersonId", ""))
                    if not fifa_id:
                        continue
                    tags = actor_tags(actor)
                    record = actors.setdefault(
                        fifa_id,
                        {
                            "fifaId": int(fifa_id),
                            "name": actor.get("name", {}).get("eng") or "",
                            "nameZh": actor.get("name", {}).get("zho") or "",
                            "teamCode": tags.get("urn:gd:tag:story:team:abbreviation", ""),
                            "position": tags.get("urn:gd:tag:story:staff:position", ""),
                            "photoOriginalUrl": tags.get("urn:gd:tag:story:staff:image"),
                            "stats": {},
                        },
                    )
                    for tag_name, value in tags.items():
                        marker = "urn:gd:tag:football:stats:"
                        if marker in tag_name:
                            record["stats"][tag_name.split(marker, 1)[1]] = value
    else:
        actors = fetch_stats_snapshot()

    squads, coaches = parse_squads(actors)
    if args.skip_photos:
        available_photos = {
            player["playerId"]
            for player in squads
            if player.get("fifaId") and (PHOTO_DIR / f"{player['fifaId']}.webp").exists()
        }
    else:
        available_photos = download_photos(squads, args.overwrite_photos)
    write_outputs(squads, coaches, available_photos)


if __name__ == "__main__":
    main()
