import type { Player, PlayerPosition, SquadStatus } from "../types/worldCup";
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
  squadStatus?: SquadStatus;
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

  // South Africa
  { teamId: "south-africa", name: "Ronwen Williams", position: "GK", age: 34, club: "Mamelodi Sundowns", marketValue: "€1.50m", marketValueEurM: 1.5, isKeyPlayer: true, predictedStarter: true, shirtNumber: 1 },
  { teamId: "south-africa", name: "Grant Kekana", position: "DF", age: 33, club: "Mamelodi Sundowns", marketValue: "€1.20m", marketValueEurM: 1.2, isKeyPlayer: false, predictedStarter: true, shirtNumber: 20 },
  { teamId: "south-africa", name: "Aubrey Modiba", position: "DF", age: 30, club: "Mamelodi Sundowns", marketValue: "€1.40m", marketValueEurM: 1.4, isKeyPlayer: false, predictedStarter: true, shirtNumber: 6 },
  { teamId: "south-africa", name: "Teboho Mokoena", position: "MF", age: 29, club: "Mamelodi Sundowns", marketValue: "€2.50m", marketValueEurM: 2.5, isKeyPlayer: true, predictedStarter: true, shirtNumber: 4 },
  { teamId: "south-africa", name: "Themba Zwane", position: "MF", age: 36, club: "Mamelodi Sundowns", marketValue: "€0.80m", marketValueEurM: 0.8, isKeyPlayer: true, predictedStarter: true, shirtNumber: 11 },
  { teamId: "south-africa", name: "Lyle Foster", position: "FW", age: 25, club: "Burnley", marketValue: "€9.00m", marketValueEurM: 9, isKeyPlayer: true, predictedStarter: true, shirtNumber: 9 },

  // Korea Republic
  { teamId: "south-korea", name: "Son Heung-min", position: "FW", age: 33, club: "LAFC", marketValue: "€20.00m", marketValueEurM: 20, isKeyPlayer: true, predictedStarter: true, shirtNumber: 7 },
  { teamId: "south-korea", name: "Kim Min-jae", position: "DF", age: 29, club: "Bayern Munich", marketValue: "€45.00m", marketValueEurM: 45, isKeyPlayer: true, predictedStarter: true, shirtNumber: 4 },
  { teamId: "south-korea", name: "Lee Kang-in", position: "MF", age: 25, club: "Paris Saint-Germain", marketValue: "€25.00m", marketValueEurM: 25, isKeyPlayer: true, predictedStarter: true, shirtNumber: 18 },
  { teamId: "south-korea", name: "Hwang Hee-chan", position: "FW", age: 30, club: "Wolverhampton Wanderers", marketValue: "€18.00m", marketValueEurM: 18, isKeyPlayer: true, predictedStarter: true, shirtNumber: 11 },
  { teamId: "south-korea", name: "Hwang In-beom", position: "MF", age: 29, club: "Feyenoord", marketValue: "€10.00m", marketValueEurM: 10, isKeyPlayer: true, predictedStarter: true, shirtNumber: 6 },
  { teamId: "south-korea", name: "Jo Hyeon-woo", position: "GK", age: 34, club: "Ulsan HD", marketValue: "€1.20m", marketValueEurM: 1.2, isKeyPlayer: false, predictedStarter: true, shirtNumber: 21 },

  // Czechia
  { teamId: "czechia", name: "Tomáš Souček", position: "MF", age: 31, club: "West Ham United", marketValue: "€25.00m", marketValueEurM: 25, isKeyPlayer: true, predictedStarter: true, shirtNumber: 22 },
  { teamId: "czechia", name: "Patrik Schick", position: "FW", age: 30, club: "Bayer Leverkusen", marketValue: "€25.00m", marketValueEurM: 25, isKeyPlayer: true, predictedStarter: true, shirtNumber: 10 },
  { teamId: "czechia", name: "Adam Hložek", position: "FW", age: 23, club: "Hoffenheim", marketValue: "€18.00m", marketValueEurM: 18, isKeyPlayer: true, predictedStarter: false, shirtNumber: 9 },
  { teamId: "czechia", name: "Antonín Barák", position: "MF", age: 31, club: "Fiorentina", marketValue: "€8.00m", marketValueEurM: 8, isKeyPlayer: false, predictedStarter: true, shirtNumber: 7 },
  { teamId: "czechia", name: "Tomáš Holeš", position: "DF", age: 33, club: "Slavia Prague", marketValue: "€3.00m", marketValueEurM: 3, isKeyPlayer: false, predictedStarter: true, shirtNumber: 3 },
  { teamId: "czechia", name: "Matěj Kovář", position: "GK", age: 26, club: "Bayer Leverkusen", marketValue: "€7.00m", marketValueEurM: 7, isKeyPlayer: false, predictedStarter: true, shirtNumber: 1 },

  // Canada
  { teamId: "canada", name: "Alphonso Davies", position: "DF", age: 25, club: "Bayern Munich", marketValue: "€50.00m", marketValueEurM: 50, isKeyPlayer: true, predictedStarter: true, shirtNumber: 19 },
  { teamId: "canada", name: "Jonathan David", position: "FW", age: 26, club: "Juventus", marketValue: "€45.00m", marketValueEurM: 45, isKeyPlayer: true, predictedStarter: true, shirtNumber: 20 },
  { teamId: "canada", name: "Tajon Buchanan", position: "FW", age: 27, club: "Villarreal", marketValue: "€8.00m", marketValueEurM: 8, isKeyPlayer: true, predictedStarter: true, shirtNumber: 11 },
  { teamId: "canada", name: "Stephen Eustáquio", position: "MF", age: 29, club: "FC Porto", marketValue: "€12.00m", marketValueEurM: 12, isKeyPlayer: true, predictedStarter: true, shirtNumber: 7 },
  { teamId: "canada", name: "Ismaël Koné", position: "MF", age: 24, club: "Sassuolo", marketValue: "€10.00m", marketValueEurM: 10, isKeyPlayer: false, predictedStarter: true, shirtNumber: 8 },
  { teamId: "canada", name: "Maxime Crépeau", position: "GK", age: 32, club: "Portland Timbers", marketValue: "€1.20m", marketValueEurM: 1.2, isKeyPlayer: false, predictedStarter: true, shirtNumber: 16 },

  // Bosnia and Herzegovina
  { teamId: "bosnia-herzegovina", name: "Edin Džeko", position: "FW", age: 40, club: "Fiorentina", marketValue: "€2.00m", marketValueEurM: 2, isKeyPlayer: true, predictedStarter: true, shirtNumber: 11 },
  { teamId: "bosnia-herzegovina", name: "Ermedin Demirović", position: "FW", age: 28, club: "Stuttgart", marketValue: "€28.00m", marketValueEurM: 28, isKeyPlayer: true, predictedStarter: true, shirtNumber: 10 },
  { teamId: "bosnia-herzegovina", name: "Amar Dedić", position: "DF", age: 23, club: "Marseille", marketValue: "€18.00m", marketValueEurM: 18, isKeyPlayer: true, predictedStarter: true, shirtNumber: 7 },
  { teamId: "bosnia-herzegovina", name: "Sead Kolašinac", position: "DF", age: 32, club: "Atalanta", marketValue: "€10.00m", marketValueEurM: 10, isKeyPlayer: true, predictedStarter: true, shirtNumber: 5 },
  { teamId: "bosnia-herzegovina", name: "Benjamin Tahirović", position: "MF", age: 23, club: "Brøndby", marketValue: "€3.00m", marketValueEurM: 3, isKeyPlayer: false, predictedStarter: true, shirtNumber: 6 },
  { teamId: "bosnia-herzegovina", name: "Nikola Vasilj", position: "GK", age: 30, club: "St. Pauli", marketValue: "€2.50m", marketValueEurM: 2.5, isKeyPlayer: false, predictedStarter: true, shirtNumber: 1 },

  // Qatar
  { teamId: "qatar", name: "Akram Afif", position: "FW", age: 29, club: "Al Sadd", marketValue: "€8.00m", marketValueEurM: 8, isKeyPlayer: true, predictedStarter: true, shirtNumber: 11 },
  { teamId: "qatar", name: "Almoez Ali", position: "FW", age: 29, club: "Al Duhail", marketValue: "€3.00m", marketValueEurM: 3, isKeyPlayer: true, predictedStarter: true, shirtNumber: 19 },
  { teamId: "qatar", name: "Meshaal Barsham", position: "GK", age: 28, club: "Al Sadd", marketValue: "€1.20m", marketValueEurM: 1.2, isKeyPlayer: false, predictedStarter: true, shirtNumber: 22 },
  { teamId: "qatar", name: "Boualem Khoukhi", position: "DF", age: 36, club: "Al Sadd", marketValue: "€0.70m", marketValueEurM: 0.7, isKeyPlayer: false, predictedStarter: true, shirtNumber: 16 },
  { teamId: "qatar", name: "Assim Madibo", position: "MF", age: 29, club: "Al Duhail", marketValue: "€1.50m", marketValueEurM: 1.5, isKeyPlayer: false, predictedStarter: true, shirtNumber: 23 },
  { teamId: "qatar", name: "Abdelkarim Hassan", position: "DF", age: 32, club: "Al Wakrah", marketValue: "€1.50m", marketValueEurM: 1.5, isKeyPlayer: true, predictedStarter: true, shirtNumber: 3 },

  // Switzerland
  { teamId: "switzerland", name: "Granit Xhaka", position: "MF", age: 33, club: "Sunderland", marketValue: "€20.00m", marketValueEurM: 20, isKeyPlayer: true, predictedStarter: true, shirtNumber: 10 },
  { teamId: "switzerland", name: "Manuel Akanji", position: "DF", age: 30, club: "Manchester City", marketValue: "€35.00m", marketValueEurM: 35, isKeyPlayer: true, predictedStarter: true, shirtNumber: 5 },
  { teamId: "switzerland", name: "Gregor Kobel", position: "GK", age: 28, club: "Borussia Dortmund", marketValue: "€40.00m", marketValueEurM: 40, isKeyPlayer: true, predictedStarter: true, shirtNumber: 1 },
  { teamId: "switzerland", name: "Breel Embolo", position: "FW", age: 29, club: "Monaco", marketValue: "€12.00m", marketValueEurM: 12, isKeyPlayer: true, predictedStarter: true, shirtNumber: 7 },
  { teamId: "switzerland", name: "Dan Ndoye", position: "FW", age: 25, club: "Nottingham Forest", marketValue: "€22.00m", marketValueEurM: 22, isKeyPlayer: true, predictedStarter: true, shirtNumber: 11 },
  { teamId: "switzerland", name: "Remo Freuler", position: "MF", age: 34, club: "Bologna", marketValue: "€6.00m", marketValueEurM: 6, isKeyPlayer: false, predictedStarter: true, shirtNumber: 8 },

  // Haiti
  { teamId: "haiti", name: "Duckens Nazon", position: "FW", age: 32, club: "Esteghlal", marketValue: "€1.20m", marketValueEurM: 1.2, isKeyPlayer: true, predictedStarter: true, shirtNumber: 9 },
  { teamId: "haiti", name: "Frantzdy Pierrot", position: "FW", age: 31, club: "AEK Athens", marketValue: "€2.00m", marketValueEurM: 2, isKeyPlayer: true, predictedStarter: true, shirtNumber: 20 },
  { teamId: "haiti", name: "Jean-Ricner Bellegarde", position: "MF", age: 28, club: "Wolverhampton Wanderers", marketValue: "€10.00m", marketValueEurM: 10, isKeyPlayer: true, predictedStarter: true, shirtNumber: 10 },
  { teamId: "haiti", name: "Danley Jean Jacques", position: "MF", age: 26, club: "Philadelphia Union", marketValue: "€3.00m", marketValueEurM: 3, isKeyPlayer: true, predictedStarter: true, shirtNumber: 17 },
  { teamId: "haiti", name: "Carlens Arcus", position: "DF", age: 29, club: "Angers", marketValue: "€1.50m", marketValueEurM: 1.5, isKeyPlayer: false, predictedStarter: true, shirtNumber: 2 },
  { teamId: "haiti", name: "Johny Placide", position: "GK", age: 38, club: "Bastia", marketValue: "€0.20m", marketValueEurM: 0.2, isKeyPlayer: false, predictedStarter: true, shirtNumber: 1 },

  // Scotland
  { teamId: "scotland", name: "Andrew Robertson", position: "DF", age: 32, club: "Liverpool", marketValue: "€20.00m", marketValueEurM: 20, isKeyPlayer: true, predictedStarter: true, shirtNumber: 3 },
  { teamId: "scotland", name: "Scott McTominay", position: "MF", age: 29, club: "Napoli", marketValue: "€35.00m", marketValueEurM: 35, isKeyPlayer: true, predictedStarter: true, shirtNumber: 4 },
  { teamId: "scotland", name: "John McGinn", position: "MF", age: 31, club: "Aston Villa", marketValue: "€25.00m", marketValueEurM: 25, isKeyPlayer: true, predictedStarter: true, shirtNumber: 7 },
  { teamId: "scotland", name: "Billy Gilmour", position: "MF", age: 24, club: "Napoli", marketValue: "€18.00m", marketValueEurM: 18, isKeyPlayer: false, predictedStarter: true, shirtNumber: 14 },
  { teamId: "scotland", name: "Che Adams", position: "FW", age: 29, club: "Torino", marketValue: "€10.00m", marketValueEurM: 10, isKeyPlayer: true, predictedStarter: true, shirtNumber: 10 },
  { teamId: "scotland", name: "Angus Gunn", position: "GK", age: 30, club: "Norwich City", marketValue: "€3.00m", marketValueEurM: 3, isKeyPlayer: false, predictedStarter: true, shirtNumber: 1 },

  // Turkiye
  { teamId: "turkiye", name: "Arda Güler", position: "MF", age: 21, club: "Real Madrid", marketValue: "€45.00m", marketValueEurM: 45, isKeyPlayer: true, predictedStarter: true, shirtNumber: 8 },
  { teamId: "turkiye", name: "Hakan Çalhanoğlu", position: "MF", age: 32, club: "Inter Milan", marketValue: "€35.00m", marketValueEurM: 35, isKeyPlayer: true, predictedStarter: true, shirtNumber: 10 },
  { teamId: "turkiye", name: "Kenan Yıldız", position: "FW", age: 21, club: "Juventus", marketValue: "€40.00m", marketValueEurM: 40, isKeyPlayer: true, predictedStarter: true, shirtNumber: 19 },
  { teamId: "turkiye", name: "Orkun Kökçü", position: "MF", age: 25, club: "Benfica", marketValue: "€30.00m", marketValueEurM: 30, isKeyPlayer: true, predictedStarter: true, shirtNumber: 6 },
  { teamId: "turkiye", name: "Ferdi Kadıoğlu", position: "DF", age: 26, club: "Brighton & Hove Albion", marketValue: "€25.00m", marketValueEurM: 25, isKeyPlayer: true, predictedStarter: true, shirtNumber: 20 },
  { teamId: "turkiye", name: "Mert Günok", position: "GK", age: 37, club: "Beşiktaş", marketValue: "€1.00m", marketValueEurM: 1, isKeyPlayer: false, predictedStarter: true, shirtNumber: 1 },

  // Australia
  { teamId: "australia", name: "Mathew Ryan", position: "GK", age: 34, club: "Lens", marketValue: "€2.00m", marketValueEurM: 2, isKeyPlayer: true, predictedStarter: true, shirtNumber: 1 },
  { teamId: "australia", name: "Harry Souttar", position: "DF", age: 27, club: "Leicester City", marketValue: "€8.00m", marketValueEurM: 8, isKeyPlayer: true, predictedStarter: true, shirtNumber: 19 },
  { teamId: "australia", name: "Jackson Irvine", position: "MF", age: 33, club: "St. Pauli", marketValue: "€4.00m", marketValueEurM: 4, isKeyPlayer: true, predictedStarter: true, shirtNumber: 22 },
  { teamId: "australia", name: "Riley McGree", position: "MF", age: 27, club: "Middlesbrough", marketValue: "€5.00m", marketValueEurM: 5, isKeyPlayer: true, predictedStarter: true, shirtNumber: 14 },
  { teamId: "australia", name: "Craig Goodwin", position: "FW", age: 34, club: "Al Wehda", marketValue: "€1.50m", marketValueEurM: 1.5, isKeyPlayer: false, predictedStarter: true, shirtNumber: 23 },
  { teamId: "australia", name: "Nestory Irankunda", position: "FW", age: 20, club: "Bayern Munich", marketValue: "€4.00m", marketValueEurM: 4, isKeyPlayer: true, predictedStarter: false, shirtNumber: 17 },

  // Paraguay
  { teamId: "paraguay", name: "Miguel Almirón", position: "MF", age: 32, club: "Atlanta United", marketValue: "€8.00m", marketValueEurM: 8, isKeyPlayer: true, predictedStarter: true, shirtNumber: 10 },
  { teamId: "paraguay", name: "Julio Enciso", position: "FW", age: 22, club: "Brighton & Hove Albion", marketValue: "€20.00m", marketValueEurM: 20, isKeyPlayer: true, predictedStarter: true, shirtNumber: 19 },
  { teamId: "paraguay", name: "Ramón Sosa", position: "FW", age: 26, club: "Nottingham Forest", marketValue: "€12.00m", marketValueEurM: 12, isKeyPlayer: true, predictedStarter: true, shirtNumber: 7 },
  { teamId: "paraguay", name: "Diego Gómez", position: "MF", age: 23, club: "Brighton & Hove Albion", marketValue: "€18.00m", marketValueEurM: 18, isKeyPlayer: true, predictedStarter: true, shirtNumber: 8 },
  { teamId: "paraguay", name: "Gustavo Gómez", position: "DF", age: 33, club: "Palmeiras", marketValue: "€8.00m", marketValueEurM: 8, isKeyPlayer: true, predictedStarter: true, shirtNumber: 15 },
  { teamId: "paraguay", name: "Gatito Fernández", position: "GK", age: 38, club: "Botafogo", marketValue: "€0.50m", marketValueEurM: 0.5, isKeyPlayer: false, predictedStarter: true, shirtNumber: 1 },

  // Curacao
  { teamId: "curacao", name: "Leandro Bacuna", position: "MF", age: 34, club: "Groningen", marketValue: "€0.80m", marketValueEurM: 0.8, isKeyPlayer: true, predictedStarter: true, shirtNumber: 10 },
  { teamId: "curacao", name: "Juninho Bacuna", position: "MF", age: 28, club: "Birmingham City", marketValue: "€2.00m", marketValueEurM: 2, isKeyPlayer: true, predictedStarter: true, shirtNumber: 7 },
  { teamId: "curacao", name: "Eloy Room", position: "GK", age: 37, club: "Vitesse", marketValue: "€0.30m", marketValueEurM: 0.3, isKeyPlayer: true, predictedStarter: true, shirtNumber: 1 },
  { teamId: "curacao", name: "Cuco Martina", position: "DF", age: 36, club: "NAC Breda", marketValue: "€0.30m", marketValueEurM: 0.3, isKeyPlayer: false, predictedStarter: true, shirtNumber: 2 },
  { teamId: "curacao", name: "Rangelo Janga", position: "FW", age: 34, club: "Nea Salamis", marketValue: "€0.30m", marketValueEurM: 0.3, isKeyPlayer: false, predictedStarter: true, shirtNumber: 9 },
  { teamId: "curacao", name: "Jearl Margaritha", position: "FW", age: 26, club: "TOP Oss", marketValue: "€0.60m", marketValueEurM: 0.6, isKeyPlayer: false, predictedStarter: true, shirtNumber: 11 },

  // Cote d'Ivoire
  { teamId: "cote-divoire", name: "Simon Adingra", position: "FW", age: 24, club: "Brighton & Hove Albion", marketValue: "€30.00m", marketValueEurM: 30, isKeyPlayer: true, predictedStarter: true, shirtNumber: 24 },
  { teamId: "cote-divoire", name: "Franck Kessié", position: "MF", age: 29, club: "Al Ahli", marketValue: "€18.00m", marketValueEurM: 18, isKeyPlayer: true, predictedStarter: true, shirtNumber: 8 },
  { teamId: "cote-divoire", name: "Evan Ndicka", position: "DF", age: 26, club: "Roma", marketValue: "€25.00m", marketValueEurM: 25, isKeyPlayer: true, predictedStarter: true, shirtNumber: 21 },
  { teamId: "cote-divoire", name: "Wilfried Singo", position: "DF", age: 25, club: "Monaco", marketValue: "€25.00m", marketValueEurM: 25, isKeyPlayer: true, predictedStarter: true, shirtNumber: 5 },
  { teamId: "cote-divoire", name: "Oumar Diakité", position: "FW", age: 22, club: "Reims", marketValue: "€10.00m", marketValueEurM: 10, isKeyPlayer: false, predictedStarter: true, shirtNumber: 11 },
  { teamId: "cote-divoire", name: "Yahia Fofana", position: "GK", age: 25, club: "Angers", marketValue: "€4.00m", marketValueEurM: 4, isKeyPlayer: false, predictedStarter: true, shirtNumber: 1 },

  // Ecuador
  { teamId: "ecuador", name: "Moisés Caicedo", position: "MF", age: 24, club: "Chelsea", marketValue: "€80.00m", marketValueEurM: 80, isKeyPlayer: true, predictedStarter: true, shirtNumber: 23 },
  { teamId: "ecuador", name: "Piero Hincapié", position: "DF", age: 24, club: "Bayer Leverkusen", marketValue: "€50.00m", marketValueEurM: 50, isKeyPlayer: true, predictedStarter: true, shirtNumber: 3 },
  { teamId: "ecuador", name: "Willian Pacho", position: "DF", age: 24, club: "Paris Saint-Germain", marketValue: "€40.00m", marketValueEurM: 40, isKeyPlayer: true, predictedStarter: true, shirtNumber: 6 },
  { teamId: "ecuador", name: "Pervis Estupiñán", position: "DF", age: 28, club: "Brighton & Hove Albion", marketValue: "€30.00m", marketValueEurM: 30, isKeyPlayer: true, predictedStarter: true, shirtNumber: 7 },
  { teamId: "ecuador", name: "Kendry Páez", position: "MF", age: 19, club: "Chelsea", marketValue: "€20.00m", marketValueEurM: 20, isKeyPlayer: true, predictedStarter: false, shirtNumber: 10 },
  { teamId: "ecuador", name: "Hernán Galíndez", position: "GK", age: 39, club: "Huracán", marketValue: "€0.50m", marketValueEurM: 0.5, isKeyPlayer: false, predictedStarter: true, shirtNumber: 1 },

  // Sweden
  { teamId: "sweden", name: "Alexander Isak", position: "FW", age: 26, club: "Liverpool", marketValue: "€120.00m", marketValueEurM: 120, isKeyPlayer: true, predictedStarter: true, shirtNumber: 9 },
  { teamId: "sweden", name: "Viktor Gyökeres", position: "FW", age: 28, club: "Arsenal", marketValue: "€75.00m", marketValueEurM: 75, isKeyPlayer: true, predictedStarter: true, shirtNumber: 17 },
  { teamId: "sweden", name: "Dejan Kulusevski", position: "MF", age: 26, club: "Tottenham Hotspur", marketValue: "€55.00m", marketValueEurM: 55, isKeyPlayer: true, predictedStarter: true, shirtNumber: 21 },
  { teamId: "sweden", name: "Anthony Elanga", position: "FW", age: 24, club: "Newcastle United", marketValue: "€30.00m", marketValueEurM: 30, isKeyPlayer: true, predictedStarter: true, shirtNumber: 11 },
  { teamId: "sweden", name: "Lucas Bergvall", position: "MF", age: 20, club: "Tottenham Hotspur", marketValue: "€18.00m", marketValueEurM: 18, isKeyPlayer: false, predictedStarter: true, shirtNumber: 8 },
  { teamId: "sweden", name: "Robin Olsen", position: "GK", age: 36, club: "Malmö FF", marketValue: "€1.00m", marketValueEurM: 1, isKeyPlayer: false, predictedStarter: true, shirtNumber: 1 },

  // Tunisia
  { teamId: "tunisia", name: "Ellyes Skhiri", position: "MF", age: 31, club: "Eintracht Frankfurt", marketValue: "€10.00m", marketValueEurM: 10, isKeyPlayer: true, predictedStarter: true, shirtNumber: 17 },
  { teamId: "tunisia", name: "Hannibal Mejbri", position: "MF", age: 23, club: "Burnley", marketValue: "€8.00m", marketValueEurM: 8, isKeyPlayer: true, predictedStarter: true, shirtNumber: 10 },
  { teamId: "tunisia", name: "Montassar Talbi", position: "DF", age: 28, club: "Lorient", marketValue: "€5.00m", marketValueEurM: 5, isKeyPlayer: true, predictedStarter: true, shirtNumber: 3 },
  { teamId: "tunisia", name: "Ali Abdi", position: "DF", age: 32, club: "Nice", marketValue: "€4.00m", marketValueEurM: 4, isKeyPlayer: false, predictedStarter: true, shirtNumber: 2 },
  { teamId: "tunisia", name: "Elias Achouri", position: "FW", age: 27, club: "Copenhagen", marketValue: "€5.00m", marketValueEurM: 5, isKeyPlayer: true, predictedStarter: true, shirtNumber: 7 },
  { teamId: "tunisia", name: "Bechir Ben Said", position: "GK", age: 31, club: "US Monastir", marketValue: "€0.80m", marketValueEurM: 0.8, isKeyPlayer: false, predictedStarter: true, shirtNumber: 1 },

  // Belgium
  { teamId: "belgium", name: "Kevin De Bruyne", position: "MF", age: 34, club: "Napoli", marketValue: "€20.00m", marketValueEurM: 20, isKeyPlayer: true, predictedStarter: true, shirtNumber: 7 },
  { teamId: "belgium", name: "Jeremy Doku", position: "FW", age: 23, club: "Manchester City", marketValue: "€65.00m", marketValueEurM: 65, isKeyPlayer: true, predictedStarter: true, shirtNumber: 11 },
  { teamId: "belgium", name: "Romelu Lukaku", position: "FW", age: 33, club: "Napoli", marketValue: "€15.00m", marketValueEurM: 15, isKeyPlayer: true, predictedStarter: true, shirtNumber: 10 },
  { teamId: "belgium", name: "Youri Tielemans", position: "MF", age: 29, club: "Aston Villa", marketValue: "€30.00m", marketValueEurM: 30, isKeyPlayer: true, predictedStarter: true, shirtNumber: 8 },
  { teamId: "belgium", name: "Arthur Theate", position: "DF", age: 26, club: "Eintracht Frankfurt", marketValue: "€25.00m", marketValueEurM: 25, isKeyPlayer: true, predictedStarter: true, shirtNumber: 3 },
  { teamId: "belgium", name: "Thibaut Courtois", position: "GK", age: 34, club: "Real Madrid", marketValue: "€25.00m", marketValueEurM: 25, isKeyPlayer: true, predictedStarter: true, shirtNumber: 1 },

  // IR Iran
  { teamId: "iran", name: "Mehdi Taremi", position: "FW", age: 33, club: "Olympiacos", marketValue: "€5.00m", marketValueEurM: 5, isKeyPlayer: true, predictedStarter: true, shirtNumber: 9 },
  { teamId: "iran", name: "Sardar Azmoun", position: "FW", age: 31, club: "Shabab Al Ahli", marketValue: "€5.00m", marketValueEurM: 5, isKeyPlayer: true, predictedStarter: true, shirtNumber: 20 },
  { teamId: "iran", name: "Alireza Jahanbakhsh", position: "FW", age: 32, club: "Heerenveen", marketValue: "€2.00m", marketValueEurM: 2, isKeyPlayer: true, predictedStarter: true, shirtNumber: 7 },
  { teamId: "iran", name: "Saman Ghoddos", position: "MF", age: 32, club: "Al Ittihad Kalba", marketValue: "€2.00m", marketValueEurM: 2, isKeyPlayer: false, predictedStarter: true, shirtNumber: 14 },
  { teamId: "iran", name: "Shoja Khalilzadeh", position: "DF", age: 36, club: "Tractor", marketValue: "€0.60m", marketValueEurM: 0.6, isKeyPlayer: false, predictedStarter: true, shirtNumber: 4 },
  { teamId: "iran", name: "Alireza Beiranvand", position: "GK", age: 33, club: "Tractor", marketValue: "€1.00m", marketValueEurM: 1, isKeyPlayer: true, predictedStarter: true, shirtNumber: 1 },

  // Egypt
  { teamId: "egypt", name: "Mohamed Salah", position: "FW", age: 34, club: "Liverpool", marketValue: "€55.00m", marketValueEurM: 55, isKeyPlayer: true, predictedStarter: true, shirtNumber: 10 },
  { teamId: "egypt", name: "Omar Marmoush", position: "FW", age: 27, club: "Manchester City", marketValue: "€60.00m", marketValueEurM: 60, isKeyPlayer: true, predictedStarter: true, shirtNumber: 22 },
  { teamId: "egypt", name: "Mostafa Mohamed", position: "FW", age: 28, club: "Nantes", marketValue: "€10.00m", marketValueEurM: 10, isKeyPlayer: true, predictedStarter: true, shirtNumber: 11 },
  { teamId: "egypt", name: "Mohamed Elneny", position: "MF", age: 33, club: "Al Jazira", marketValue: "€2.00m", marketValueEurM: 2, isKeyPlayer: false, predictedStarter: true, shirtNumber: 17 },
  { teamId: "egypt", name: "Mohamed Abdelmonem", position: "DF", age: 27, club: "Nice", marketValue: "€5.00m", marketValueEurM: 5, isKeyPlayer: true, predictedStarter: true, shirtNumber: 2 },
  { teamId: "egypt", name: "Mohamed El Shenawy", position: "GK", age: 37, club: "Al Ahly", marketValue: "€1.00m", marketValueEurM: 1, isKeyPlayer: false, predictedStarter: true, shirtNumber: 1 },

  // New Zealand
  { teamId: "new-zealand", name: "Chris Wood", position: "FW", age: 34, club: "Nottingham Forest", marketValue: "€10.00m", marketValueEurM: 10, isKeyPlayer: true, predictedStarter: true, shirtNumber: 9 },
  { teamId: "new-zealand", name: "Sarpreet Singh", position: "MF", age: 27, club: "União de Leiria", marketValue: "€1.00m", marketValueEurM: 1, isKeyPlayer: true, predictedStarter: true, shirtNumber: 10 },
  { teamId: "new-zealand", name: "Liberato Cacace", position: "DF", age: 25, club: "Wrexham", marketValue: "€3.00m", marketValueEurM: 3, isKeyPlayer: true, predictedStarter: true, shirtNumber: 13 },
  { teamId: "new-zealand", name: "Marko Stamenic", position: "MF", age: 24, club: "Olympiacos", marketValue: "€4.00m", marketValueEurM: 4, isKeyPlayer: true, predictedStarter: true, shirtNumber: 8 },
  { teamId: "new-zealand", name: "Nando Pijnaker", position: "DF", age: 27, club: "Sligo Rovers", marketValue: "€0.50m", marketValueEurM: 0.5, isKeyPlayer: false, predictedStarter: true, shirtNumber: 4 },
  { teamId: "new-zealand", name: "Max Crocombe", position: "GK", age: 32, club: "Burton Albion", marketValue: "€0.50m", marketValueEurM: 0.5, isKeyPlayer: false, predictedStarter: true, shirtNumber: 1 },

  // Cape Verde
  { teamId: "cape-verde", name: "Ryan Mendes", position: "FW", age: 36, club: "Kocaelispor", marketValue: "€0.70m", marketValueEurM: 0.7, isKeyPlayer: true, predictedStarter: true, shirtNumber: 20 },
  { teamId: "cape-verde", name: "Bebé", position: "FW", age: 35, club: "Ibiza", marketValue: "€0.50m", marketValueEurM: 0.5, isKeyPlayer: true, predictedStarter: true, shirtNumber: 11 },
  { teamId: "cape-verde", name: "Logan Costa", position: "DF", age: 25, club: "Villarreal", marketValue: "€15.00m", marketValueEurM: 15, isKeyPlayer: true, predictedStarter: true, shirtNumber: 5 },
  { teamId: "cape-verde", name: "Dylan Tavares", position: "DF", age: 29, club: "Bastia", marketValue: "€1.00m", marketValueEurM: 1, isKeyPlayer: false, predictedStarter: true, shirtNumber: 22 },
  { teamId: "cape-verde", name: "Jamiro Monteiro", position: "MF", age: 32, club: "PEC Zwolle", marketValue: "€1.00m", marketValueEurM: 1, isKeyPlayer: true, predictedStarter: true, shirtNumber: 10 },
  { teamId: "cape-verde", name: "Vozinha", position: "GK", age: 40, club: "Chaves", marketValue: "€0.20m", marketValueEurM: 0.2, isKeyPlayer: false, predictedStarter: true, shirtNumber: 1 },

  // Saudi Arabia
  { teamId: "saudi-arabia", name: "Salem Al-Dawsari", position: "FW", age: 34, club: "Al Hilal", marketValue: "€2.50m", marketValueEurM: 2.5, isKeyPlayer: true, predictedStarter: true, shirtNumber: 10 },
  { teamId: "saudi-arabia", name: "Firas Al-Buraikan", position: "FW", age: 25, club: "Al Ahli", marketValue: "€6.00m", marketValueEurM: 6, isKeyPlayer: true, predictedStarter: true, shirtNumber: 9 },
  { teamId: "saudi-arabia", name: "Mohamed Kanno", position: "MF", age: 31, club: "Al Hilal", marketValue: "€1.50m", marketValueEurM: 1.5, isKeyPlayer: true, predictedStarter: true, shirtNumber: 23 },
  { teamId: "saudi-arabia", name: "Saud Abdulhamid", position: "DF", age: 26, club: "Lens", marketValue: "€4.00m", marketValueEurM: 4, isKeyPlayer: true, predictedStarter: true, shirtNumber: 12 },
  { teamId: "saudi-arabia", name: "Hassan Tambakti", position: "DF", age: 27, club: "Al Hilal", marketValue: "€2.50m", marketValueEurM: 2.5, isKeyPlayer: false, predictedStarter: true, shirtNumber: 17 },
  { teamId: "saudi-arabia", name: "Mohammed Al-Owais", position: "GK", age: 34, club: "Al Hilal", marketValue: "€0.80m", marketValueEurM: 0.8, isKeyPlayer: false, predictedStarter: true, shirtNumber: 21 },

  // Uruguay
  { teamId: "uruguay", name: "Federico Valverde", position: "MF", age: 27, club: "Real Madrid", marketValue: "€130.00m", marketValueEurM: 130, isKeyPlayer: true, predictedStarter: true, shirtNumber: 15 },
  { teamId: "uruguay", name: "Darwin Núñez", position: "FW", age: 26, club: "Liverpool", marketValue: "€70.00m", marketValueEurM: 70, isKeyPlayer: true, predictedStarter: true, shirtNumber: 9 },
  { teamId: "uruguay", name: "Ronald Araújo", position: "DF", age: 27, club: "Barcelona", marketValue: "€55.00m", marketValueEurM: 55, isKeyPlayer: true, predictedStarter: true, shirtNumber: 4 },
  { teamId: "uruguay", name: "Manuel Ugarte", position: "MF", age: 25, club: "Manchester United", marketValue: "€45.00m", marketValueEurM: 45, isKeyPlayer: true, predictedStarter: true, shirtNumber: 5 },
  { teamId: "uruguay", name: "Rodrigo Bentancur", position: "MF", age: 28, club: "Tottenham Hotspur", marketValue: "€35.00m", marketValueEurM: 35, isKeyPlayer: true, predictedStarter: true, shirtNumber: 6 },
  { teamId: "uruguay", name: "Sergio Rochet", position: "GK", age: 33, club: "Internacional", marketValue: "€3.00m", marketValueEurM: 3, isKeyPlayer: false, predictedStarter: true, shirtNumber: 1 },

  // Senegal
  { teamId: "senegal", name: "Sadio Mané", position: "FW", age: 34, club: "Al Nassr", marketValue: "€12.00m", marketValueEurM: 12, isKeyPlayer: true, predictedStarter: true, shirtNumber: 10 },
  { teamId: "senegal", name: "Nicolas Jackson", position: "FW", age: 25, club: "Chelsea", marketValue: "€50.00m", marketValueEurM: 50, isKeyPlayer: true, predictedStarter: true, shirtNumber: 7 },
  { teamId: "senegal", name: "Pape Matar Sarr", position: "MF", age: 23, club: "Tottenham Hotspur", marketValue: "€35.00m", marketValueEurM: 35, isKeyPlayer: true, predictedStarter: true, shirtNumber: 17 },
  { teamId: "senegal", name: "Kalidou Koulibaly", position: "DF", age: 34, club: "Al Hilal", marketValue: "€8.00m", marketValueEurM: 8, isKeyPlayer: true, predictedStarter: true, shirtNumber: 3 },
  { teamId: "senegal", name: "Ismaila Sarr", position: "FW", age: 28, club: "Crystal Palace", marketValue: "€18.00m", marketValueEurM: 18, isKeyPlayer: true, predictedStarter: true, shirtNumber: 18 },
  { teamId: "senegal", name: "Édouard Mendy", position: "GK", age: 34, club: "Al Ahli", marketValue: "€6.00m", marketValueEurM: 6, isKeyPlayer: false, predictedStarter: true, shirtNumber: 16 },

  // Norway
  { teamId: "norway", name: "Erling Haaland", position: "FW", age: 25, club: "Manchester City", marketValue: "€200.00m", marketValueEurM: 200, isKeyPlayer: true, predictedStarter: true, shirtNumber: 9 },
  { teamId: "norway", name: "Martin Ødegaard", position: "MF", age: 27, club: "Arsenal", marketValue: "€110.00m", marketValueEurM: 110, isKeyPlayer: true, predictedStarter: true, shirtNumber: 10 },
  { teamId: "norway", name: "Antonio Nusa", position: "FW", age: 21, club: "RB Leipzig", marketValue: "€25.00m", marketValueEurM: 25, isKeyPlayer: true, predictedStarter: true, shirtNumber: 11 },
  { teamId: "norway", name: "Oscar Bobb", position: "FW", age: 22, club: "Manchester City", marketValue: "€25.00m", marketValueEurM: 25, isKeyPlayer: true, predictedStarter: false, shirtNumber: 17 },
  { teamId: "norway", name: "Sander Berge", position: "MF", age: 28, club: "Fulham", marketValue: "€20.00m", marketValueEurM: 20, isKeyPlayer: false, predictedStarter: true, shirtNumber: 8 },
  { teamId: "norway", name: "Ørjan Nyland", position: "GK", age: 35, club: "Sevilla", marketValue: "€1.50m", marketValueEurM: 1.5, isKeyPlayer: false, predictedStarter: true, shirtNumber: 1 },

  // Iraq
  { teamId: "iraq", name: "Aymen Hussein", position: "FW", age: 30, club: "Al Khor", marketValue: "€1.50m", marketValueEurM: 1.5, isKeyPlayer: true, predictedStarter: true, shirtNumber: 18 },
  { teamId: "iraq", name: "Ali Jasim", position: "FW", age: 22, club: "Almere City", marketValue: "€2.00m", marketValueEurM: 2, isKeyPlayer: true, predictedStarter: true, shirtNumber: 7 },
  { teamId: "iraq", name: "Zidane Iqbal", position: "MF", age: 23, club: "Utrecht", marketValue: "€2.50m", marketValueEurM: 2.5, isKeyPlayer: true, predictedStarter: true, shirtNumber: 14 },
  { teamId: "iraq", name: "Ibrahim Bayesh", position: "MF", age: 26, club: "Al Riyadh", marketValue: "€1.20m", marketValueEurM: 1.2, isKeyPlayer: false, predictedStarter: true, shirtNumber: 8 },
  { teamId: "iraq", name: "Rebin Sulaka", position: "DF", age: 34, club: "Al Kholood", marketValue: "€0.50m", marketValueEurM: 0.5, isKeyPlayer: false, predictedStarter: true, shirtNumber: 2 },
  { teamId: "iraq", name: "Jalal Hassan", position: "GK", age: 35, club: "Al Zawraa", marketValue: "€0.40m", marketValueEurM: 0.4, isKeyPlayer: false, predictedStarter: true, shirtNumber: 1 },

  // Algeria
  { teamId: "algeria", name: "Riyad Mahrez", position: "FW", age: 35, club: "Al Ahli", marketValue: "€8.00m", marketValueEurM: 8, isKeyPlayer: true, predictedStarter: true, shirtNumber: 7 },
  { teamId: "algeria", name: "Ismaël Bennacer", position: "MF", age: 28, club: "AC Milan", marketValue: "€25.00m", marketValueEurM: 25, isKeyPlayer: true, predictedStarter: true, shirtNumber: 22 },
  { teamId: "algeria", name: "Rayan Aït-Nouri", position: "DF", age: 25, club: "Manchester City", marketValue: "€35.00m", marketValueEurM: 35, isKeyPlayer: true, predictedStarter: true, shirtNumber: 15 },
  { teamId: "algeria", name: "Houssem Aouar", position: "MF", age: 28, club: "Al Ittihad", marketValue: "€10.00m", marketValueEurM: 10, isKeyPlayer: true, predictedStarter: true, shirtNumber: 8 },
  { teamId: "algeria", name: "Amine Gouiri", position: "FW", age: 26, club: "Marseille", marketValue: "€25.00m", marketValueEurM: 25, isKeyPlayer: true, predictedStarter: true, shirtNumber: 9 },
  { teamId: "algeria", name: "Anthony Mandrea", position: "GK", age: 29, club: "Caen", marketValue: "€1.50m", marketValueEurM: 1.5, isKeyPlayer: false, predictedStarter: true, shirtNumber: 1 },

  // Austria
  { teamId: "austria", name: "David Alaba", position: "DF", age: 33, club: "Real Madrid", marketValue: "€8.00m", marketValueEurM: 8, isKeyPlayer: true, predictedStarter: true, shirtNumber: 8 },
  { teamId: "austria", name: "Marcel Sabitzer", position: "MF", age: 32, club: "Borussia Dortmund", marketValue: "€20.00m", marketValueEurM: 20, isKeyPlayer: true, predictedStarter: true, shirtNumber: 9 },
  { teamId: "austria", name: "Christoph Baumgartner", position: "MF", age: 26, club: "RB Leipzig", marketValue: "€25.00m", marketValueEurM: 25, isKeyPlayer: true, predictedStarter: true, shirtNumber: 19 },
  { teamId: "austria", name: "Konrad Laimer", position: "MF", age: 29, club: "Bayern Munich", marketValue: "€30.00m", marketValueEurM: 30, isKeyPlayer: true, predictedStarter: true, shirtNumber: 20 },
  { teamId: "austria", name: "Michael Gregoritsch", position: "FW", age: 32, club: "SC Freiburg", marketValue: "€6.00m", marketValueEurM: 6, isKeyPlayer: false, predictedStarter: true, shirtNumber: 11 },
  { teamId: "austria", name: "Patrick Pentz", position: "GK", age: 29, club: "Brøndby", marketValue: "€3.00m", marketValueEurM: 3, isKeyPlayer: false, predictedStarter: true, shirtNumber: 1 },

  // Jordan
  { teamId: "jordan", name: "Mousa Al-Taamari", position: "FW", age: 28, club: "Rennes", marketValue: "€6.00m", marketValueEurM: 6, isKeyPlayer: true, predictedStarter: true, shirtNumber: 10 },
  { teamId: "jordan", name: "Yazan Al-Naimat", position: "FW", age: 26, club: "Al Ahli", marketValue: "€2.50m", marketValueEurM: 2.5, isKeyPlayer: true, predictedStarter: true, shirtNumber: 11 },
  { teamId: "jordan", name: "Noor Al-Rawabdeh", position: "MF", age: 29, club: "Selangor", marketValue: "€0.70m", marketValueEurM: 0.7, isKeyPlayer: true, predictedStarter: true, shirtNumber: 8 },
  { teamId: "jordan", name: "Nizar Al-Rashdan", position: "MF", age: 27, club: "Al Hussein", marketValue: "€0.80m", marketValueEurM: 0.8, isKeyPlayer: false, predictedStarter: true, shirtNumber: 14 },
  { teamId: "jordan", name: "Abdallah Nasib", position: "DF", age: 32, club: "Al Hussein", marketValue: "€0.50m", marketValueEurM: 0.5, isKeyPlayer: false, predictedStarter: true, shirtNumber: 3 },
  { teamId: "jordan", name: "Yazeed Abulaila", position: "GK", age: 33, club: "Al Hussein", marketValue: "€0.40m", marketValueEurM: 0.4, isKeyPlayer: false, predictedStarter: true, shirtNumber: 1 },

  // Colombia
  { teamId: "colombia", name: "Luis Díaz", position: "FW", age: 29, club: "Bayern Munich", marketValue: "€70.00m", marketValueEurM: 70, isKeyPlayer: true, predictedStarter: true, shirtNumber: 7 },
  { teamId: "colombia", name: "James Rodríguez", position: "MF", age: 34, club: "León", marketValue: "€3.00m", marketValueEurM: 3, isKeyPlayer: true, predictedStarter: true, shirtNumber: 10 },
  { teamId: "colombia", name: "Jhon Durán", position: "FW", age: 22, club: "Fenerbahçe", marketValue: "€35.00m", marketValueEurM: 35, isKeyPlayer: true, predictedStarter: false, shirtNumber: 9 },
  { teamId: "colombia", name: "Jefferson Lerma", position: "MF", age: 31, club: "Crystal Palace", marketValue: "€15.00m", marketValueEurM: 15, isKeyPlayer: true, predictedStarter: true, shirtNumber: 16 },
  { teamId: "colombia", name: "Daniel Muñoz", position: "DF", age: 30, club: "Crystal Palace", marketValue: "€25.00m", marketValueEurM: 25, isKeyPlayer: true, predictedStarter: true, shirtNumber: 21 },
  { teamId: "colombia", name: "Camilo Vargas", position: "GK", age: 37, club: "Atlas", marketValue: "€1.00m", marketValueEurM: 1, isKeyPlayer: false, predictedStarter: true, shirtNumber: 12 },

  // Uzbekistan
  { teamId: "uzbekistan", name: "Eldor Shomurodov", position: "FW", age: 31, club: "İstanbul Başakşehir", marketValue: "€5.00m", marketValueEurM: 5, isKeyPlayer: true, predictedStarter: true, shirtNumber: 14 },
  { teamId: "uzbekistan", name: "Abbosbek Fayzullaev", position: "MF", age: 22, club: "İstanbul Başakşehir", marketValue: "€8.00m", marketValueEurM: 8, isKeyPlayer: true, predictedStarter: true, shirtNumber: 10 },
  { teamId: "uzbekistan", name: "Abdukodir Khusanov", position: "DF", age: 22, club: "Manchester City", marketValue: "€35.00m", marketValueEurM: 35, isKeyPlayer: true, predictedStarter: true, shirtNumber: 2 },
  { teamId: "uzbekistan", name: "Oston Urunov", position: "MF", age: 25, club: "Persepolis", marketValue: "€2.00m", marketValueEurM: 2, isKeyPlayer: false, predictedStarter: true, shirtNumber: 11 },
  { teamId: "uzbekistan", name: "Odiljon Hamrobekov", position: "MF", age: 30, club: "Pakhtakor", marketValue: "€1.20m", marketValueEurM: 1.2, isKeyPlayer: false, predictedStarter: true, shirtNumber: 7 },
  { teamId: "uzbekistan", name: "Utkir Yusupov", position: "GK", age: 35, club: "Navbahor", marketValue: "€0.70m", marketValueEurM: 0.7, isKeyPlayer: false, predictedStarter: true, shirtNumber: 1 },

  // DR Congo
  { teamId: "dr-congo", name: "Yoane Wissa", position: "FW", age: 29, club: "Newcastle United", marketValue: "€25.00m", marketValueEurM: 25, isKeyPlayer: true, predictedStarter: true, shirtNumber: 20 },
  { teamId: "dr-congo", name: "Cédric Bakambu", position: "FW", age: 35, club: "Real Betis", marketValue: "€3.00m", marketValueEurM: 3, isKeyPlayer: true, predictedStarter: true, shirtNumber: 17 },
  { teamId: "dr-congo", name: "Samuel Moutoussamy", position: "MF", age: 29, club: "Sivasspor", marketValue: "€3.00m", marketValueEurM: 3, isKeyPlayer: false, predictedStarter: true, shirtNumber: 8 },
  { teamId: "dr-congo", name: "Chancel Mbemba", position: "DF", age: 31, club: "Lille", marketValue: "€5.00m", marketValueEurM: 5, isKeyPlayer: true, predictedStarter: true, shirtNumber: 22 },
  { teamId: "dr-congo", name: "Arthur Masuaku", position: "DF", age: 32, club: "Sunderland", marketValue: "€3.00m", marketValueEurM: 3, isKeyPlayer: true, predictedStarter: true, shirtNumber: 3 },
  { teamId: "dr-congo", name: "Lionel Mpasi", position: "GK", age: 31, club: "Le Havre", marketValue: "€1.50m", marketValueEurM: 1.5, isKeyPlayer: false, predictedStarter: true, shirtNumber: 1 },

  // Croatia
  { teamId: "croatia", name: "Luka Modrić", position: "MF", age: 40, club: "AC Milan", marketValue: "€4.00m", marketValueEurM: 4, isKeyPlayer: true, predictedStarter: true, shirtNumber: 10 },
  { teamId: "croatia", name: "Joško Gvardiol", position: "DF", age: 24, club: "Manchester City", marketValue: "€75.00m", marketValueEurM: 75, isKeyPlayer: true, predictedStarter: true, shirtNumber: 4 },
  { teamId: "croatia", name: "Mateo Kovačić", position: "MF", age: 32, club: "Manchester City", marketValue: "€28.00m", marketValueEurM: 28, isKeyPlayer: true, predictedStarter: true, shirtNumber: 8 },
  { teamId: "croatia", name: "Lovro Majer", position: "MF", age: 28, club: "Wolfsburg", marketValue: "€20.00m", marketValueEurM: 20, isKeyPlayer: false, predictedStarter: true, shirtNumber: 7 },
  { teamId: "croatia", name: "Andrej Kramarić", position: "FW", age: 34, club: "Hoffenheim", marketValue: "€6.00m", marketValueEurM: 6, isKeyPlayer: true, predictedStarter: true, shirtNumber: 9 },
  { teamId: "croatia", name: "Dominik Livaković", position: "GK", age: 31, club: "Girona", marketValue: "€6.00m", marketValueEurM: 6, isKeyPlayer: false, predictedStarter: true, shirtNumber: 1 },

  // Ghana
  { teamId: "ghana", name: "Mohammed Kudus", position: "FW", age: 25, club: "Tottenham Hotspur", marketValue: "€55.00m", marketValueEurM: 55, isKeyPlayer: true, predictedStarter: true, shirtNumber: 20 },
  { teamId: "ghana", name: "Thomas Partey", position: "MF", age: 32, club: "Villarreal", marketValue: "€10.00m", marketValueEurM: 10, isKeyPlayer: true, predictedStarter: true, shirtNumber: 5 },
  { teamId: "ghana", name: "Antoine Semenyo", position: "FW", age: 26, club: "Bournemouth", marketValue: "€35.00m", marketValueEurM: 35, isKeyPlayer: true, predictedStarter: true, shirtNumber: 19 },
  { teamId: "ghana", name: "Jordan Ayew", position: "FW", age: 34, club: "Leicester City", marketValue: "€4.00m", marketValueEurM: 4, isKeyPlayer: false, predictedStarter: true, shirtNumber: 9 },
  { teamId: "ghana", name: "Alexander Djiku", position: "DF", age: 31, club: "Fenerbahçe", marketValue: "€7.00m", marketValueEurM: 7, isKeyPlayer: true, predictedStarter: true, shirtNumber: 23 },
  { teamId: "ghana", name: "Lawrence Ati-Zigi", position: "GK", age: 29, club: "St. Gallen", marketValue: "€1.50m", marketValueEurM: 1.5, isKeyPlayer: false, predictedStarter: true, shirtNumber: 1 },

  // Panama
  { teamId: "panama", name: "Adalberto Carrasquilla", position: "MF", age: 27, club: "Pumas UNAM", marketValue: "€5.00m", marketValueEurM: 5, isKeyPlayer: true, predictedStarter: true, shirtNumber: 8 },
  { teamId: "panama", name: "Michael Murillo", position: "DF", age: 30, club: "Marseille", marketValue: "€4.00m", marketValueEurM: 4, isKeyPlayer: true, predictedStarter: true, shirtNumber: 23 },
  { teamId: "panama", name: "José Fajardo", position: "FW", age: 32, club: "Universidad Católica", marketValue: "€1.00m", marketValueEurM: 1, isKeyPlayer: true, predictedStarter: true, shirtNumber: 17 },
  { teamId: "panama", name: "César Blackman", position: "DF", age: 28, club: "Slovan Bratislava", marketValue: "€1.50m", marketValueEurM: 1.5, isKeyPlayer: false, predictedStarter: true, shirtNumber: 2 },
  { teamId: "panama", name: "Édgar Bárcenas", position: "FW", age: 32, club: "Mazatlán", marketValue: "€1.20m", marketValueEurM: 1.2, isKeyPlayer: false, predictedStarter: true, shirtNumber: 10 },
  { teamId: "panama", name: "Orlando Mosquera", position: "GK", age: 31, club: "Al Fayha", marketValue: "€0.80m", marketValueEurM: 0.8, isKeyPlayer: false, predictedStarter: true, shirtNumber: 1 },
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
  photoSource: "placeholder",
  photoCredit: "Generated placeholder avatar from player initials",
  photoLastUpdated: "2026-05-26",
  squadStatus: seed.squadStatus ?? "projected",
  transfermarktUrl: transfermarktSearchUrl(seed.name),
  lastUpdated: "2026-05-26",
  sourceUrls: [commonSourceUrls.transfermarkt],
  dataQuality: "projected",
}));
