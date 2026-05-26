import type { Language } from "../i18n";
import type { Team } from "../types/worldCup";

export interface TeamGuide {
  beginnerIntro: string;
  playStyle: string;
  keyStrengths: string[];
  weaknesses: string[];
  playersToWatch: string[];
  historicalNote: string;
  whyTheyMatter: string;
}

export const teamGuides: Record<string, Record<Language, TeamGuide>> = {
  argentina: {
    zh: {
      beginnerIntro: "阿根廷是近几年国际足坛最稳定的强队之一，技术细腻，比赛经验丰富，适合新手重点关注。",
      playStyle: "强调控球、短传配合和前场创造力，关键时刻常依靠核心球员的个人灵感改变比赛。",
      keyStrengths: ["中前场创造力强", "大赛经验丰富", "关键球员个人能力强"],
      weaknesses: ["部分位置年龄偏大", "面对高强度逼抢时需要更多体能支持"],
      playersToWatch: ["莱昂内尔·梅西", "劳塔罗·马丁内斯", "恩佐·费尔南德斯"],
      historicalNote: "阿根廷是世界杯传统强队，多次进入决赛并夺冠。",
      whyTheyMatter: "如果你是足球新手，阿根廷很适合作为理解南美技术流足球的代表球队。",
    },
    en: {
      beginnerIntro: "Argentina are one of the most stable elite national teams, combining technique, patience, and big-match experience.",
      playStyle: "They value possession, short passing, and creative attackers who can decide tight games.",
      keyStrengths: ["Creative midfield and attack", "Rich tournament experience", "Elite individual match-winners"],
      weaknesses: ["Some roles are aging", "High pressing can test their physical intensity"],
      playersToWatch: ["Lionel Messi", "Lautaro Martínez", "Enzo Fernández"],
      historicalNote: "Argentina are a historic World Cup power with multiple titles and finals.",
      whyTheyMatter: "They are a great starting point for understanding South American technical football.",
    },
  },
  france: {
    zh: {
      beginnerIntro: "法国的阵容深度非常夸张，速度、身体、技术都很强，是最容易理解的冠军热门之一。",
      playStyle: "攻守转换很快，喜欢利用边路速度和前场球星制造一对一机会。",
      keyStrengths: ["阵容厚度顶级", "速度和身体对抗强", "防线与中场都很均衡"],
      weaknesses: ["球星很多时需要平衡球权", "遇到密集防守时可能需要更多耐心"],
      playersToWatch: ["基利安·姆巴佩", "奥雷利安·楚阿梅尼", "威廉·萨利巴"],
      historicalNote: "法国近三十年一直是世界杯最成功的球队之一。",
      whyTheyMatter: "看法国可以帮助新手理解现代足球中的速度、身体和空间利用。",
    },
    en: {
      beginnerIntro: "France have extraordinary depth, mixing speed, physical power, and technical quality across the pitch.",
      playStyle: "They transition quickly and use wide speed to create one-on-one chances.",
      keyStrengths: ["Elite squad depth", "Powerful athletes", "Balanced midfield and defense"],
      weaknesses: ["Many stars must share the ball", "Low blocks can demand patience"],
      playersToWatch: ["Kylian Mbappé", "Aurélien Tchouaméni", "William Saliba"],
      historicalNote: "France have been one of the World Cup's most successful teams in the modern era.",
      whyTheyMatter: "They show how speed, power, and space define modern international football.",
    },
  },
  brazil: {
    zh: {
      beginnerIntro: "巴西是足球文化最浓的球队之一，前场天才很多，比赛观赏性非常强。",
      playStyle: "喜欢边路突破、快速传切和个人盘带，进攻端常常充满想象力。",
      keyStrengths: ["边锋个人能力强", "进攻选择丰富", "门将和中卫质量高"],
      weaknesses: ["中场控制有时不够稳定", "过度依赖前场个人发挥"],
      playersToWatch: ["维尼修斯·儒尼奥尔", "罗德里戈", "布鲁诺·吉马良斯"],
      historicalNote: "巴西是世界杯历史上最具代表性的传统豪门之一。",
      whyTheyMatter: "想理解足球为什么好看，巴西的进攻天赋是很好的入口。",
    },
    en: {
      beginnerIntro: "Brazil are one of football's most iconic teams, famous for attacking talent and expressive play.",
      playStyle: "They use wide dribblers, quick combinations, and individual creativity in the final third.",
      keyStrengths: ["Elite wingers", "Many attacking options", "Strong goalkeeper and center-back quality"],
      weaknesses: ["Midfield control can fluctuate", "Attack may depend on individual moments"],
      playersToWatch: ["Vinícius Júnior", "Rodrygo", "Bruno Guimarães"],
      historicalNote: "Brazil are among the most famous World Cup powers in history.",
      whyTheyMatter: "They are a perfect gateway into the joy and creativity of football.",
    },
  },
  england: {
    zh: {
      beginnerIntro: "英格兰拥有世界上身价最高的一批球员，很多人来自英超，新手会很容易在俱乐部比赛中继续追踪他们。",
      playStyle: "注重身体强度和前场压迫，也依靠中前场球星之间的配合创造机会。",
      keyStrengths: ["前场选择极多", "中场硬度和技术兼备", "定位球威胁大"],
      weaknesses: ["大赛心理压力常被放大", "如何安排众多攻击手是难题"],
      playersToWatch: ["裘德·贝林厄姆", "布卡约·萨卡", "哈里·凯恩"],
      historicalNote: "英格兰是现代足球发源地之一，但国家队长期背负冠军期待。",
      whyTheyMatter: "看英格兰可以理解英超球星如何组合成国家队。",
    },
    en: {
      beginnerIntro: "England have one of the most valuable squads in world football, with many familiar Premier League stars.",
      playStyle: "They combine physical intensity, pressing, set pieces, and combinations between elite attackers.",
      keyStrengths: ["Huge attacking depth", "Technical and physical midfield", "Strong set-piece threat"],
      weaknesses: ["Tournament pressure can grow quickly", "Fitting all attackers together is difficult"],
      playersToWatch: ["Jude Bellingham", "Bukayo Saka", "Harry Kane"],
      historicalNote: "England are the birthplace of modern football but carry a long national-team title expectation.",
      whyTheyMatter: "They help beginners connect club football stars with international football.",
    },
  },
  spain: {
    zh: {
      beginnerIntro: "西班牙适合新手学习什么叫控球足球，他们通过传球和站位慢慢拆开对手防线。",
      playStyle: "强调控球、传切、边路宽度和中场节奏控制。",
      keyStrengths: ["传控体系成熟", "年轻天才多", "边路突破和中场组织兼备"],
      weaknesses: ["有时需要更直接的终结方式", "面对身体强队时对抗压力较大"],
      playersToWatch: ["拉明·亚马尔", "佩德里", "罗德里"],
      historicalNote: "西班牙曾以传控足球统治世界足坛，并多次赢得欧洲杯。",
      whyTheyMatter: "如果想看懂传球、跑位和控球，西班牙是最好的教材之一。",
    },
    en: {
      beginnerIntro: "Spain are ideal for learning possession football, using passing and positioning to open defenses.",
      playStyle: "They focus on possession, combinations, width, and midfield tempo control.",
      keyStrengths: ["Mature possession system", "Many young stars", "Wing threat plus midfield control"],
      weaknesses: ["May need more direct finishing", "Physical opponents can test them"],
      playersToWatch: ["Lamine Yamal", "Pedri", "Rodri"],
      historicalNote: "Spain once dominated world football with possession play and have won multiple European titles.",
      whyTheyMatter: "They are one of the best teams for understanding passing, movement, and control.",
    },
  },
  portugal: {
    zh: {
      beginnerIntro: "葡萄牙阵容非常豪华，老将和新星并存，适合观察不同类型攻击手如何搭配。",
      playStyle: "喜欢通过技术型中场组织，再把球交给边路或禁区附近的攻击手处理。",
      keyStrengths: ["中前场技术强", "阵容深度好", "后防有顶级中卫"],
      weaknesses: ["锋线角色分配需要清晰", "有时进攻节奏会偏慢"],
      playersToWatch: ["克里斯蒂亚诺·罗纳尔多", "布鲁诺·费尔南德斯", "鲁本·迪亚斯"],
      historicalNote: "葡萄牙近十多年人才井喷，是欧洲最稳定的强队之一。",
      whyTheyMatter: "他们能帮助新手理解球星个人能力和团队结构之间的关系。",
    },
    en: {
      beginnerIntro: "Portugal have a luxurious squad blending veterans and new stars, especially in attacking roles.",
      playStyle: "Technical midfielders organize play before finding creators and finishers near the box.",
      keyStrengths: ["Technical attack and midfield", "Excellent depth", "Top center-back quality"],
      weaknesses: ["Forward roles need clarity", "Tempo can become slow"],
      playersToWatch: ["Cristiano Ronaldo", "Bruno Fernandes", "Rúben Dias"],
      historicalNote: "Portugal have become one of Europe's most consistent talent producers.",
      whyTheyMatter: "They show how individual stars fit into a broader team structure.",
    },
  },
  germany: {
    zh: {
      beginnerIntro: "德国一直以纪律性和整体性著称，现在又有很多年轻进攻天才。",
      playStyle: "强调高位压迫、快速推进和前场多人换位。",
      keyStrengths: ["组织纪律强", "中前场天才多", "比赛节奏快"],
      weaknesses: ["防线身后空间可能被利用", "年轻球员稳定性仍需观察"],
      playersToWatch: ["贾马尔·穆西亚拉", "弗洛里安·维尔茨", "约书亚·基米希"],
      historicalNote: "德国是世界杯历史上最稳定的强队之一。",
      whyTheyMatter: "看德国可以理解团队纪律和现代压迫足球。",
    },
    en: {
      beginnerIntro: "Germany are known for structure and discipline, now boosted by exciting young attacking talent.",
      playStyle: "They press high, progress quickly, and rotate attackers between lines.",
      keyStrengths: ["Strong organization", "Creative young attackers", "High tempo"],
      weaknesses: ["Space behind the defense can be attacked", "Young players need consistency"],
      playersToWatch: ["Jamal Musiala", "Florian Wirtz", "Joshua Kimmich"],
      historicalNote: "Germany are one of the most consistent teams in World Cup history.",
      whyTheyMatter: "They help beginners understand team discipline and modern pressing.",
    },
  },
  netherlands: {
    zh: {
      beginnerIntro: "荷兰常被称为“橙衣军团”，他们重视阵型、传球和后场出球。",
      playStyle: "从后场组织进攻，依靠中卫和中场把球推进到前场。",
      keyStrengths: ["中卫质量顶级", "战术纪律好", "中场技术细腻"],
      weaknesses: ["锋线终结稳定性需要提升", "面对低位防守可能缺少爆点"],
      playersToWatch: ["维吉尔·范戴克", "弗朗基·德容", "哈维·西蒙斯"],
      historicalNote: "荷兰对现代足球战术发展影响很大，虽然世界杯冠军仍是遗憾。",
      whyTheyMatter: "他们适合新手学习阵型、站位和从后场发起进攻。",
    },
    en: {
      beginnerIntro: "The Netherlands, known as Oranje, value structure, passing, and building attacks from the back.",
      playStyle: "They progress from defense through technically strong center-backs and midfielders.",
      keyStrengths: ["Elite center-backs", "Good tactical discipline", "Technical midfield"],
      weaknesses: ["Finishing can be inconsistent", "Low blocks may limit their attacking spark"],
      playersToWatch: ["Virgil van Dijk", "Frenkie de Jong", "Xavi Simons"],
      historicalNote: "The Netherlands have shaped modern football tactics, even without a World Cup title.",
      whyTheyMatter: "They are useful for learning shape, positioning, and build-up play.",
    },
  },
  usa: {
    zh: {
      beginnerIntro: "美国是东道主之一，球员运动能力强，很多人正在欧洲主流联赛成长。",
      playStyle: "强调跑动、压迫和快速反击，比赛节奏通常很快。",
      keyStrengths: ["体能和速度好", "主场优势明显", "核心球员年龄结构不错"],
      weaknesses: ["阵地战创造力有时不足", "关键比赛经验还在积累"],
      playersToWatch: ["克里斯蒂安·普利希奇", "韦斯顿·麦肯尼", "安东尼·罗宾逊"],
      historicalNote: "美国足球近年发展很快，2026 主场世界杯是重要窗口。",
      whyTheyMatter: "看美国可以理解北美足球如何向世界强队靠近。",
    },
    en: {
      beginnerIntro: "The USA are co-hosts with strong athletes and many players developing in major European leagues.",
      playStyle: "They rely on running power, pressing, and quick transitions.",
      keyStrengths: ["Pace and fitness", "Home advantage", "Good age profile"],
      weaknesses: ["Chance creation in settled possession can vary", "Big-match experience is still growing"],
      playersToWatch: ["Christian Pulisic", "Weston McKennie", "Antonee Robinson"],
      historicalNote: "US soccer has grown quickly, and 2026 is a major home-stage opportunity.",
      whyTheyMatter: "They show how North American football is trying to close the global gap.",
    },
  },
  mexico: {
    zh: {
      beginnerIntro: "墨西哥是东道主之一，世界杯经验丰富，球迷氛围非常热烈。",
      playStyle: "喜欢边路推进和快速传中，也会依靠中场球员控制比赛节奏。",
      keyStrengths: ["主场氛围强", "世界杯经验多", "前锋和后腰位置有代表球员"],
      weaknesses: ["近年更新换代压力较大", "面对顶级强队时进攻效率要提高"],
      playersToWatch: ["圣地亚哥·希门尼斯", "埃德森·阿尔瓦雷斯", "伊尔文·洛萨诺"],
      historicalNote: "墨西哥经常能从世界杯小组赛出线，是非常稳定的参赛队。",
      whyTheyMatter: "他们适合新手感受世界杯主场氛围和 CONCACAF 足球特色。",
    },
    en: {
      beginnerIntro: "Mexico are co-hosts with huge World Cup experience and one of the tournament's liveliest fan cultures.",
      playStyle: "They use wide attacks and crosses while midfielders try to manage tempo.",
      keyStrengths: ["Strong home atmosphere", "World Cup experience", "Recognizable striker and defensive midfield roles"],
      weaknesses: ["Squad renewal is a challenge", "Efficiency must improve against elite teams"],
      playersToWatch: ["Santiago Giménez", "Edson Álvarez", "Hirving Lozano"],
      historicalNote: "Mexico are consistently competitive in World Cup group stages.",
      whyTheyMatter: "They help beginners feel the host-nation energy and CONCACAF style.",
    },
  },
  japan: {
    zh: {
      beginnerIntro: "日本技术细腻、纪律性强，是亚洲足球现代化的代表球队。",
      playStyle: "强调快速传递、整体跑位和前场灵活换位。",
      keyStrengths: ["整体纪律好", "球员技术稳定", "反击速度快"],
      weaknesses: ["身体对抗有时吃亏", "面对高空球冲击要更谨慎"],
      playersToWatch: ["久保建英", "三笘薰", "远藤航"],
      historicalNote: "日本近几届世界杯多次制造惊喜，已经具备挑战强队的能力。",
      whyTheyMatter: "他们适合新手理解团队配合如何弥补身体差距。",
    },
    en: {
      beginnerIntro: "Japan are a modern Asian football model: technical, disciplined, and tactically flexible.",
      playStyle: "They use quick passing, coordinated movement, and flexible attacking rotations.",
      keyStrengths: ["Excellent team discipline", "Reliable technique", "Fast transitions"],
      weaknesses: ["Physical duels can be difficult", "Aerial pressure needs careful management"],
      playersToWatch: ["Takefusa Kubo", "Kaoru Mitoma", "Wataru Endo"],
      historicalNote: "Japan have produced several World Cup upsets and can challenge elite teams.",
      whyTheyMatter: "They show how teamwork and technique can close physical gaps.",
    },
  },
  morocco: {
    zh: {
      beginnerIntro: "摩洛哥是近年最值得关注的非洲强队，2022 年世界杯表现让全世界印象深刻。",
      playStyle: "防守组织严密，反击速度快，边后卫参与进攻很积极。",
      keyStrengths: ["防守纪律强", "边路质量高", "大赛信心足"],
      weaknesses: ["阵地战破密集防守不总是稳定", "核心球员健康很重要"],
      playersToWatch: ["阿什拉夫·哈基米", "布拉欣·迪亚斯", "雅辛·布努"],
      historicalNote: "摩洛哥曾在 2022 年成为首支进入世界杯四强的非洲球队。",
      whyTheyMatter: "他们很适合作为理解现代非洲强队的入口。",
    },
    en: {
      beginnerIntro: "Morocco are one of Africa's most exciting teams, remembered globally for their 2022 World Cup run.",
      playStyle: "They defend compactly, counter quickly, and use attacking full-backs.",
      keyStrengths: ["Strong defensive discipline", "High-quality wide players", "Big-match belief"],
      weaknesses: ["Breaking deep blocks can vary", "Core player fitness is crucial"],
      playersToWatch: ["Achraf Hakimi", "Brahim Díaz", "Yassine Bounou"],
      historicalNote: "Morocco became the first African team to reach a World Cup semi-final in 2022.",
      whyTheyMatter: "They are a strong entry point for understanding modern African football.",
    },
  },
};

interface GetTeamGuideOptions {
  team: Team;
  language: Language;
  teamName: string;
  playerNames: string[];
}

const fallbackWatchPlayers = (playerNames: string[], language: Language) => {
  if (playerNames.length > 0) return playerNames.slice(0, 3);
  return language === "zh" ? ["核心前锋", "中场组织者", "主力门将"] : ["Key forward", "Midfield organizer", "Starting goalkeeper"];
};

const fallbackGuide = ({ team, language, teamName, playerNames }: GetTeamGuideOptions): TeamGuide => {
  const watchPlayers = fallbackWatchPlayers(playerNames, language);
  const formation = team.formation ?? (language === "zh" ? "稳定阵型" : "a balanced shape");

  if (language === "zh") {
    const contenderText =
      team.strengthRank <= 16
        ? "本预测把他们看作有淘汰赛竞争力的球队，适合新手重点观察整体实力和比赛节奏。"
        : team.isDarkHorse
          ? "他们不是最热门的冠军候选，但具备制造冷门的潜力，适合观察弱势一方如何寻找机会。"
          : "他们在强队面前容错率不高，但很适合新手学习小组赛中不同风格球队的生存方式。";

    return {
      beginnerIntro: `${teamName} 位于 ${team.group} 组，预测实力排名第 ${team.strengthRank}，实力评分 ${team.strengthScore}。${contenderText}`,
      playStyle: `预计常用 ${formation}，比赛重点通常会落在阵型纪律、攻守转换和关键球员处理球的效率上。`,
      keyStrengths: [
        team.predictedGroupPosition <= 2 ? "小组出线前景相对清晰" : "面对强队时会更重视防守组织",
        team.isDarkHorse ? "具备黑马属性和冷门潜力" : "战术执行和团队结构是观察重点",
        team.strengthScore >= 75 ? "核心球员质量较高" : "比赛态度和整体跑动很关键",
      ],
      weaknesses: [
        team.strengthRank > 32 ? "阵容深度与顶级球队相比有差距" : "关键位置状态会明显影响上限",
        team.predictedGroupPosition >= 3 ? "小组赛每一场都需要抢分" : "淘汰赛遇到高强度对手时会被考验",
      ],
      playersToWatch: watchPlayers,
      historicalNote: `${teamName} 的世界杯故事适合结合小组形势一起看：看他们如何在有限场次里调整策略、争取晋级机会。`,
      whyTheyMatter: `如果你是足球新手，观察 ${teamName} 可以帮助你理解世界杯不只是豪门对决，也包括不同足球文化、阵型选择和临场决策。`,
    };
  }

  const contenderText =
    team.strengthRank <= 16
      ? "This projection treats them as a knockout-level side, useful for learning how stronger teams control games."
      : team.isDarkHorse
        ? "They are not a title favorite, but they have upset potential and are useful for watching underdog game plans."
        : "They have less margin against elite teams, but they are useful for understanding group-stage survival.";

  return {
    beginnerIntro: `${teamName} are in Group ${team.group}, ranked #${team.strengthRank} in this predictor with a ${team.strengthScore} strength score. ${contenderText}`,
    playStyle: `They are projected around ${formation}, with the key viewing points being defensive shape, transitions, and how efficiently their best players use the ball.`,
    keyStrengths: [
      team.predictedGroupPosition <= 2 ? "Clearer path toward group qualification" : "Defensive organization matters against stronger opponents",
      team.isDarkHorse ? "Dark-horse potential" : "Team structure and tactical discipline are important",
      team.strengthScore >= 75 ? "Good core-player quality" : "Work rate and compactness are crucial",
    ],
    weaknesses: [
      team.strengthRank > 32 ? "Squad depth trails the top teams" : "Key-position form can define their ceiling",
      team.predictedGroupPosition >= 3 ? "Every group match carries pressure" : "High-intensity knockout opponents can test them",
    ],
    playersToWatch: watchPlayers,
    historicalNote: `${teamName}'s tournament story is best read through the group context: how they adjust over three matches and chase qualification.`,
    whyTheyMatter: `For beginners, ${teamName} show that a World Cup is not only about superpowers; it is also about football cultures, shapes, and match management.`,
  };
};

export const getTeamGuide = (options: GetTeamGuideOptions) =>
  teamGuides[options.team.id]?.[options.language] ?? fallbackGuide(options);
