import type { Player, PlayerPosition } from "../types/worldCup";
import { commonSourceUrls } from "./sources";

interface PlayerSeed {
  teamId: string;
  name: string;
  position: PlayerPosition;
  age: number;
  club: string;
  marketValue: string;
  marketValueEurM: number;
  isKeyPlayer: boolean;
  predictedStarter: boolean;
  shirtNumber?: number;
}

const avatarUrl = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0f172a&color=f8fafc&bold=true&size=160`;

const transfermarktSearchUrl = (name: string) =>
  `https://www.transfermarkt.com/schnellsuche/ergebnis/schnellsuche?query=${encodeURIComponent(name)}`;

const seeds: PlayerSeed[] = [
  // Argentina
  { teamId: "argentina", name: "Lionel Messi", position: "FW", age: 38, club: "Inter Miami", marketValue: "€20.00m", marketValueEurM: 20, isKeyPlayer: true, predictedStarter: true, shirtNumber: 10 },
  { teamId: "argentina", name: "Julián Alvarez", position: "FW", age: 26, club: "Atlético Madrid", marketValue: "€100.00m", marketValueEurM: 100, isKeyPlayer: true, predictedStarter: true, shirtNumber: 9 },
  { teamId: "argentina", name: "Lautaro Martínez", position: "FW", age: 28, club: "Inter Milan", marketValue: "€95.00m", marketValueEurM: 95, isKeyPlayer: true, predictedStarter: false, shirtNumber: 22 },
  { teamId: "argentina", name: "Alexis Mac Allister", position: "MF", age: 27, club: "Liverpool", marketValue: "€80.00m", marketValueEurM: 80, isKeyPlayer: true, predictedStarter: true, shirtNumber: 20 },
  { teamId: "argentina", name: "Enzo Fernández", position: "MF", age: 25, club: "Chelsea", marketValue: "€80.00m", marketValueEurM: 80, isKeyPlayer: true, predictedStarter: true, shirtNumber: 24 },
  { teamId: "argentina", name: "Cristian Romero", position: "DF", age: 28, club: "Tottenham Hotspur", marketValue: "€65.00m", marketValueEurM: 65, isKeyPlayer: true, predictedStarter: true, shirtNumber: 13 },
  { teamId: "argentina", name: "Nicolás Tagliafico", position: "DF", age: 33, club: "Lyon", marketValue: "€8.00m", marketValueEurM: 8, isKeyPlayer: false, predictedStarter: true, shirtNumber: 3 },
  { teamId: "argentina", name: "Emiliano Martínez", position: "GK", age: 33, club: "Aston Villa", marketValue: "€20.00m", marketValueEurM: 20, isKeyPlayer: true, predictedStarter: true, shirtNumber: 23 },

  // France
  { teamId: "france", name: "Kylian Mbappé", position: "FW", age: 27, club: "Real Madrid", marketValue: "€180.00m", marketValueEurM: 180, isKeyPlayer: true, predictedStarter: true, shirtNumber: 10 },
  { teamId: "france", name: "Ousmane Dembélé", position: "FW", age: 29, club: "Paris Saint-Germain", marketValue: "€75.00m", marketValueEurM: 75, isKeyPlayer: true, predictedStarter: true, shirtNumber: 11 },
  { teamId: "france", name: "Bradley Barcola", position: "FW", age: 23, club: "Paris Saint-Germain", marketValue: "€70.00m", marketValueEurM: 70, isKeyPlayer: false, predictedStarter: false, shirtNumber: 20 },
  { teamId: "france", name: "Aurélien Tchouaméni", position: "MF", age: 26, club: "Real Madrid", marketValue: "€90.00m", marketValueEurM: 90, isKeyPlayer: true, predictedStarter: true, shirtNumber: 8 },
  { teamId: "france", name: "Eduardo Camavinga", position: "MF", age: 23, club: "Real Madrid", marketValue: "€80.00m", marketValueEurM: 80, isKeyPlayer: true, predictedStarter: true, shirtNumber: 6 },
  { teamId: "france", name: "William Saliba", position: "DF", age: 25, club: "Arsenal", marketValue: "€80.00m", marketValueEurM: 80, isKeyPlayer: true, predictedStarter: true, shirtNumber: 17 },
  { teamId: "france", name: "Jules Koundé", position: "DF", age: 27, club: "Barcelona", marketValue: "€55.00m", marketValueEurM: 55, isKeyPlayer: false, predictedStarter: true, shirtNumber: 5 },
  { teamId: "france", name: "Mike Maignan", position: "GK", age: 30, club: "AC Milan", marketValue: "€35.00m", marketValueEurM: 35, isKeyPlayer: true, predictedStarter: true, shirtNumber: 16 },

  // Brazil
  { teamId: "brazil", name: "Vinícius Júnior", position: "FW", age: 25, club: "Real Madrid", marketValue: "€200.00m", marketValueEurM: 200, isKeyPlayer: true, predictedStarter: true, shirtNumber: 7 },
  { teamId: "brazil", name: "Rodrygo", position: "FW", age: 25, club: "Real Madrid", marketValue: "€100.00m", marketValueEurM: 100, isKeyPlayer: true, predictedStarter: true, shirtNumber: 11 },
  { teamId: "brazil", name: "Raphinha", position: "FW", age: 29, club: "Barcelona", marketValue: "€90.00m", marketValueEurM: 90, isKeyPlayer: true, predictedStarter: true, shirtNumber: 10 },
  { teamId: "brazil", name: "Endrick", position: "FW", age: 19, club: "Real Madrid", marketValue: "€60.00m", marketValueEurM: 60, isKeyPlayer: false, predictedStarter: false, shirtNumber: 9 },
  { teamId: "brazil", name: "Bruno Guimarães", position: "MF", age: 28, club: "Newcastle United", marketValue: "€80.00m", marketValueEurM: 80, isKeyPlayer: true, predictedStarter: true, shirtNumber: 5 },
  { teamId: "brazil", name: "Gabriel Magalhães", position: "DF", age: 28, club: "Arsenal", marketValue: "€75.00m", marketValueEurM: 75, isKeyPlayer: true, predictedStarter: true, shirtNumber: 4 },
  { teamId: "brazil", name: "Marquinhos", position: "DF", age: 32, club: "Paris Saint-Germain", marketValue: "€45.00m", marketValueEurM: 45, isKeyPlayer: false, predictedStarter: true, shirtNumber: 3 },
  { teamId: "brazil", name: "Alisson", position: "GK", age: 33, club: "Liverpool", marketValue: "€25.00m", marketValueEurM: 25, isKeyPlayer: true, predictedStarter: true, shirtNumber: 1 },

  // England
  { teamId: "england", name: "Jude Bellingham", position: "MF", age: 22, club: "Real Madrid", marketValue: "€180.00m", marketValueEurM: 180, isKeyPlayer: true, predictedStarter: true, shirtNumber: 10 },
  { teamId: "england", name: "Bukayo Saka", position: "FW", age: 24, club: "Arsenal", marketValue: "€150.00m", marketValueEurM: 150, isKeyPlayer: true, predictedStarter: true, shirtNumber: 7 },
  { teamId: "england", name: "Phil Foden", position: "MF", age: 26, club: "Manchester City", marketValue: "€120.00m", marketValueEurM: 120, isKeyPlayer: true, predictedStarter: true, shirtNumber: 11 },
  { teamId: "england", name: "Cole Palmer", position: "MF", age: 24, club: "Chelsea", marketValue: "€120.00m", marketValueEurM: 120, isKeyPlayer: true, predictedStarter: false, shirtNumber: 20 },
  { teamId: "england", name: "Declan Rice", position: "MF", age: 27, club: "Arsenal", marketValue: "€120.00m", marketValueEurM: 120, isKeyPlayer: true, predictedStarter: true, shirtNumber: 4 },
  { teamId: "england", name: "Harry Kane", position: "FW", age: 32, club: "Bayern Munich", marketValue: "€60.00m", marketValueEurM: 60, isKeyPlayer: true, predictedStarter: true, shirtNumber: 9 },
  { teamId: "england", name: "John Stones", position: "DF", age: 32, club: "Manchester City", marketValue: "€35.00m", marketValueEurM: 35, isKeyPlayer: false, predictedStarter: true, shirtNumber: 5 },
  { teamId: "england", name: "Jordan Pickford", position: "GK", age: 32, club: "Everton", marketValue: "€20.00m", marketValueEurM: 20, isKeyPlayer: false, predictedStarter: true, shirtNumber: 1 },

  // Spain
  { teamId: "spain", name: "Lamine Yamal", position: "FW", age: 18, club: "Barcelona", marketValue: "€180.00m", marketValueEurM: 180, isKeyPlayer: true, predictedStarter: true, shirtNumber: 19 },
  { teamId: "spain", name: "Pedri", position: "MF", age: 23, club: "Barcelona", marketValue: "€120.00m", marketValueEurM: 120, isKeyPlayer: true, predictedStarter: true, shirtNumber: 8 },
  { teamId: "spain", name: "Rodri", position: "MF", age: 29, club: "Manchester City", marketValue: "€100.00m", marketValueEurM: 100, isKeyPlayer: true, predictedStarter: true, shirtNumber: 16 },
  { teamId: "spain", name: "Pau Cubarsí", position: "DF", age: 19, club: "Barcelona", marketValue: "€80.00m", marketValueEurM: 80, isKeyPlayer: false, predictedStarter: true, shirtNumber: 5 },
  { teamId: "spain", name: "Nico Williams", position: "FW", age: 23, club: "Athletic Club", marketValue: "€70.00m", marketValueEurM: 70, isKeyPlayer: true, predictedStarter: true, shirtNumber: 17 },
  { teamId: "spain", name: "Dani Olmo", position: "MF", age: 28, club: "Barcelona", marketValue: "€60.00m", marketValueEurM: 60, isKeyPlayer: false, predictedStarter: false, shirtNumber: 10 },
  { teamId: "spain", name: "Fabián Ruiz", position: "MF", age: 30, club: "Paris Saint-Germain", marketValue: "€60.00m", marketValueEurM: 60, isKeyPlayer: true, predictedStarter: true, shirtNumber: 8 },
  { teamId: "spain", name: "Unai Simón", position: "GK", age: 29, club: "Athletic Club", marketValue: "€30.00m", marketValueEurM: 30, isKeyPlayer: false, predictedStarter: true, shirtNumber: 23 },

  // Portugal
  { teamId: "portugal", name: "Cristiano Ronaldo", position: "FW", age: 41, club: "Al Nassr", marketValue: "€10.00m", marketValueEurM: 10, isKeyPlayer: true, predictedStarter: false, shirtNumber: 7 },
  { teamId: "portugal", name: "Rafael Leão", position: "FW", age: 26, club: "AC Milan", marketValue: "€75.00m", marketValueEurM: 75, isKeyPlayer: true, predictedStarter: true, shirtNumber: 17 },
  { teamId: "portugal", name: "Bruno Fernandes", position: "MF", age: 31, club: "Manchester United", marketValue: "€55.00m", marketValueEurM: 55, isKeyPlayer: true, predictedStarter: true, shirtNumber: 8 },
  { teamId: "portugal", name: "Bernardo Silva", position: "MF", age: 31, club: "Manchester City", marketValue: "€60.00m", marketValueEurM: 60, isKeyPlayer: true, predictedStarter: true, shirtNumber: 10 },
  { teamId: "portugal", name: "Vitinha", position: "MF", age: 26, club: "Paris Saint-Germain", marketValue: "€100.00m", marketValueEurM: 100, isKeyPlayer: true, predictedStarter: true, shirtNumber: 23 },
  { teamId: "portugal", name: "João Neves", position: "MF", age: 21, club: "Paris Saint-Germain", marketValue: "€80.00m", marketValueEurM: 80, isKeyPlayer: true, predictedStarter: true, shirtNumber: 18 },
  { teamId: "portugal", name: "Rúben Dias", position: "DF", age: 29, club: "Manchester City", marketValue: "€80.00m", marketValueEurM: 80, isKeyPlayer: true, predictedStarter: true, shirtNumber: 4 },
  { teamId: "portugal", name: "Diogo Costa", position: "GK", age: 26, club: "FC Porto", marketValue: "€45.00m", marketValueEurM: 45, isKeyPlayer: false, predictedStarter: true, shirtNumber: 22 },

  // Germany
  { teamId: "germany", name: "Jamal Musiala", position: "MF", age: 23, club: "Bayern Munich", marketValue: "€140.00m", marketValueEurM: 140, isKeyPlayer: true, predictedStarter: true, shirtNumber: 10 },
  { teamId: "germany", name: "Florian Wirtz", position: "MF", age: 23, club: "Bayer Leverkusen", marketValue: "€130.00m", marketValueEurM: 130, isKeyPlayer: true, predictedStarter: true, shirtNumber: 17 },
  { teamId: "germany", name: "Kai Havertz", position: "FW", age: 26, club: "Arsenal", marketValue: "€70.00m", marketValueEurM: 70, isKeyPlayer: true, predictedStarter: true, shirtNumber: 7 },
  { teamId: "germany", name: "Joshua Kimmich", position: "MF", age: 31, club: "Bayern Munich", marketValue: "€50.00m", marketValueEurM: 50, isKeyPlayer: true, predictedStarter: true, shirtNumber: 6 },
  { teamId: "germany", name: "Antonio Rüdiger", position: "DF", age: 33, club: "Real Madrid", marketValue: "€25.00m", marketValueEurM: 25, isKeyPlayer: true, predictedStarter: true, shirtNumber: 2 },
  { teamId: "germany", name: "Jonathan Tah", position: "DF", age: 30, club: "Bayern Munich", marketValue: "€35.00m", marketValueEurM: 35, isKeyPlayer: false, predictedStarter: true, shirtNumber: 4 },
  { teamId: "germany", name: "David Raum", position: "DF", age: 28, club: "RB Leipzig", marketValue: "€30.00m", marketValueEurM: 30, isKeyPlayer: false, predictedStarter: true, shirtNumber: 3 },
  { teamId: "germany", name: "Marc-André ter Stegen", position: "GK", age: 34, club: "Barcelona", marketValue: "€20.00m", marketValueEurM: 20, isKeyPlayer: false, predictedStarter: true, shirtNumber: 1 },

  // Netherlands
  { teamId: "netherlands", name: "Virgil van Dijk", position: "DF", age: 34, club: "Liverpool", marketValue: "€25.00m", marketValueEurM: 25, isKeyPlayer: true, predictedStarter: true, shirtNumber: 4 },
  { teamId: "netherlands", name: "Frenkie de Jong", position: "MF", age: 29, club: "Barcelona", marketValue: "€60.00m", marketValueEurM: 60, isKeyPlayer: true, predictedStarter: true, shirtNumber: 21 },
  { teamId: "netherlands", name: "Cody Gakpo", position: "FW", age: 27, club: "Liverpool", marketValue: "€65.00m", marketValueEurM: 65, isKeyPlayer: true, predictedStarter: true, shirtNumber: 11 },
  { teamId: "netherlands", name: "Xavi Simons", position: "MF", age: 23, club: "RB Leipzig", marketValue: "€80.00m", marketValueEurM: 80, isKeyPlayer: true, predictedStarter: true, shirtNumber: 7 },
  { teamId: "netherlands", name: "Tijjani Reijnders", position: "MF", age: 27, club: "Manchester City", marketValue: "€60.00m", marketValueEurM: 60, isKeyPlayer: true, predictedStarter: true, shirtNumber: 14 },
  { teamId: "netherlands", name: "Denzel Dumfries", position: "DF", age: 30, club: "Inter Milan", marketValue: "€25.00m", marketValueEurM: 25, isKeyPlayer: false, predictedStarter: true, shirtNumber: 22 },
  { teamId: "netherlands", name: "Nathan Aké", position: "DF", age: 31, club: "Manchester City", marketValue: "€30.00m", marketValueEurM: 30, isKeyPlayer: false, predictedStarter: true, shirtNumber: 5 },
  { teamId: "netherlands", name: "Bart Verbruggen", position: "GK", age: 23, club: "Brighton & Hove Albion", marketValue: "€25.00m", marketValueEurM: 25, isKeyPlayer: false, predictedStarter: true, shirtNumber: 1 },

  // USA
  { teamId: "usa", name: "Christian Pulisic", position: "FW", age: 27, club: "AC Milan", marketValue: "€50.00m", marketValueEurM: 50, isKeyPlayer: true, predictedStarter: true, shirtNumber: 10 },
  { teamId: "usa", name: "Folarin Balogun", position: "FW", age: 24, club: "Monaco", marketValue: "€35.00m", marketValueEurM: 35, isKeyPlayer: true, predictedStarter: true, shirtNumber: 20 },
  { teamId: "usa", name: "Gio Reyna", position: "MF", age: 23, club: "Borussia Dortmund", marketValue: "€18.00m", marketValueEurM: 18, isKeyPlayer: true, predictedStarter: false, shirtNumber: 7 },
  { teamId: "usa", name: "Weston McKennie", position: "MF", age: 27, club: "Juventus", marketValue: "€25.00m", marketValueEurM: 25, isKeyPlayer: true, predictedStarter: true, shirtNumber: 8 },
  { teamId: "usa", name: "Yunus Musah", position: "MF", age: 23, club: "AC Milan", marketValue: "€25.00m", marketValueEurM: 25, isKeyPlayer: false, predictedStarter: true, shirtNumber: 6 },
  { teamId: "usa", name: "Tyler Adams", position: "MF", age: 27, club: "Bournemouth", marketValue: "€18.00m", marketValueEurM: 18, isKeyPlayer: true, predictedStarter: true, shirtNumber: 4 },
  { teamId: "usa", name: "Antonee Robinson", position: "DF", age: 28, club: "Fulham", marketValue: "€35.00m", marketValueEurM: 35, isKeyPlayer: true, predictedStarter: true, shirtNumber: 5 },
  { teamId: "usa", name: "Matt Turner", position: "GK", age: 31, club: "Nottingham Forest", marketValue: "€4.00m", marketValueEurM: 4, isKeyPlayer: false, predictedStarter: true, shirtNumber: 1 },

  // Mexico
  { teamId: "mexico", name: "Santiago Giménez", position: "FW", age: 25, club: "AC Milan", marketValue: "€35.00m", marketValueEurM: 35, isKeyPlayer: true, predictedStarter: true, shirtNumber: 9 },
  { teamId: "mexico", name: "Edson Álvarez", position: "MF", age: 28, club: "West Ham United", marketValue: "€28.00m", marketValueEurM: 28, isKeyPlayer: true, predictedStarter: true, shirtNumber: 4 },
  { teamId: "mexico", name: "Hirving Lozano", position: "FW", age: 30, club: "San Diego FC", marketValue: "€8.00m", marketValueEurM: 8, isKeyPlayer: true, predictedStarter: true, shirtNumber: 22 },
  { teamId: "mexico", name: "Luis Chávez", position: "MF", age: 30, club: "Dynamo Moscow", marketValue: "€8.00m", marketValueEurM: 8, isKeyPlayer: false, predictedStarter: true, shirtNumber: 24 },
  { teamId: "mexico", name: "Johan Vásquez", position: "DF", age: 27, club: "Genoa", marketValue: "€12.00m", marketValueEurM: 12, isKeyPlayer: true, predictedStarter: true, shirtNumber: 5 },
  { teamId: "mexico", name: "César Montes", position: "DF", age: 29, club: "Lokomotiv Moscow", marketValue: "€7.00m", marketValueEurM: 7, isKeyPlayer: false, predictedStarter: true, shirtNumber: 3 },
  { teamId: "mexico", name: "Julián Quiñones", position: "FW", age: 29, club: "Al Qadsiah", marketValue: "€10.00m", marketValueEurM: 10, isKeyPlayer: false, predictedStarter: false, shirtNumber: 11 },
  { teamId: "mexico", name: "Luis Malagón", position: "GK", age: 29, club: "Club América", marketValue: "€8.00m", marketValueEurM: 8, isKeyPlayer: false, predictedStarter: true, shirtNumber: 1 },

  // Japan
  { teamId: "japan", name: "Takefusa Kubo", position: "FW", age: 25, club: "Real Sociedad", marketValue: "€50.00m", marketValueEurM: 50, isKeyPlayer: true, predictedStarter: true, shirtNumber: 20 },
  { teamId: "japan", name: "Kaoru Mitoma", position: "FW", age: 29, club: "Brighton & Hove Albion", marketValue: "€45.00m", marketValueEurM: 45, isKeyPlayer: true, predictedStarter: true, shirtNumber: 7 },
  { teamId: "japan", name: "Takumi Minamino", position: "MF", age: 31, club: "Monaco", marketValue: "€18.00m", marketValueEurM: 18, isKeyPlayer: true, predictedStarter: true, shirtNumber: 10 },
  { teamId: "japan", name: "Wataru Endo", position: "MF", age: 33, club: "Liverpool", marketValue: "€10.00m", marketValueEurM: 10, isKeyPlayer: true, predictedStarter: true, shirtNumber: 6 },
  { teamId: "japan", name: "Ritsu Doan", position: "FW", age: 27, club: "SC Freiburg", marketValue: "€18.00m", marketValueEurM: 18, isKeyPlayer: false, predictedStarter: true, shirtNumber: 8 },
  { teamId: "japan", name: "Ayase Ueda", position: "FW", age: 27, club: "Feyenoord", marketValue: "€12.00m", marketValueEurM: 12, isKeyPlayer: false, predictedStarter: false, shirtNumber: 9 },
  { teamId: "japan", name: "Takehiro Tomiyasu", position: "DF", age: 27, club: "Arsenal", marketValue: "€25.00m", marketValueEurM: 25, isKeyPlayer: true, predictedStarter: true, shirtNumber: 16 },
  { teamId: "japan", name: "Zion Suzuki", position: "GK", age: 23, club: "Parma", marketValue: "€12.00m", marketValueEurM: 12, isKeyPlayer: false, predictedStarter: true, shirtNumber: 1 },

  // Morocco
  { teamId: "morocco", name: "Achraf Hakimi", position: "DF", age: 27, club: "Paris Saint-Germain", marketValue: "€60.00m", marketValueEurM: 60, isKeyPlayer: true, predictedStarter: true, shirtNumber: 2 },
  { teamId: "morocco", name: "Brahim Díaz", position: "MF", age: 26, club: "Real Madrid", marketValue: "€40.00m", marketValueEurM: 40, isKeyPlayer: true, predictedStarter: true, shirtNumber: 10 },
  { teamId: "morocco", name: "Sofyan Amrabat", position: "MF", age: 29, club: "Fenerbahçe", marketValue: "€18.00m", marketValueEurM: 18, isKeyPlayer: true, predictedStarter: true, shirtNumber: 4 },
  { teamId: "morocco", name: "Noussair Mazraoui", position: "DF", age: 28, club: "Manchester United", marketValue: "€30.00m", marketValueEurM: 30, isKeyPlayer: true, predictedStarter: true, shirtNumber: 3 },
  { teamId: "morocco", name: "Nayef Aguerd", position: "DF", age: 30, club: "West Ham United", marketValue: "€25.00m", marketValueEurM: 25, isKeyPlayer: false, predictedStarter: true, shirtNumber: 5 },
  { teamId: "morocco", name: "Youssef En-Nesyri", position: "FW", age: 29, club: "Fenerbahçe", marketValue: "€22.00m", marketValueEurM: 22, isKeyPlayer: true, predictedStarter: true, shirtNumber: 19 },
  { teamId: "morocco", name: "Azzedine Ounahi", position: "MF", age: 26, club: "Panathinaikos", marketValue: "€12.00m", marketValueEurM: 12, isKeyPlayer: false, predictedStarter: false, shirtNumber: 8 },
  { teamId: "morocco", name: "Yassine Bounou", position: "GK", age: 35, club: "Al Hilal", marketValue: "€8.00m", marketValueEurM: 8, isKeyPlayer: true, predictedStarter: true, shirtNumber: 1 },
];

export const players: Player[] = seeds.map((seed, index) => ({
  playerId: `${seed.teamId}-${index + 1}-${seed.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}`,
  ...seed,
  photoUrl: avatarUrl(seed.name),
  transfermarktUrl: transfermarktSearchUrl(seed.name),
  lastUpdated: "2026-05-26",
  sourceUrls: [commonSourceUrls.transfermarkt],
  dataQuality: "projected",
}));
