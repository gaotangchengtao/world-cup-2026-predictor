# Player photo attribution

The player headshots in this directory are resized local copies of image URLs
returned by FIFA's public 2026 World Cup player-statistics interface.

- Source page: https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/statistics/player-statistics
- Source system: FIFA Digital Hub
- Download purpose: local display inside this non-commercial tournament data project
- Processing: resized to 192 x 192 WebP

The update script records original image URLs in the ignored local audit file
`data/raw/fifa-player-stats-snapshot.json`. Images should not be redistributed
outside the context allowed by the source. Missing or failed images fall back
to generated initials and are not replaced through anti-bot evasion or
unapproved scraping.
