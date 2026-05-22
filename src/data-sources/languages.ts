/**
 * Languages of the day — French + Chinese, with each split into a single
 * vocabulary item AND a full phrase/sentence. Four picks shown per day.
 *
 * Source: `command-center/languages.md`. User-editable. The dashboard
 * rotates a fresh quartet daily (each track independently).
 *
 * Sections (case-insensitive):
 *   ## French Words
 *   ## French Phrases
 *   ## Chinese Words
 *   ## Chinese Phrases
 *
 * Line format inside any section:
 *   `- text | meaning | optional note`
 *
 * For Chinese, embed pinyin in parens after the characters so the
 * dashboard can display pronunciation:
 *   `- 加油 (jiā yóu) | keep going | motivational`
 */

import { App, normalizePath, TFile } from "obsidian";

export type Phrase = {
  text: string;             // the phrase in its native script (no pinyin)
  pronunciation?: string;   // pinyin for Chinese, parsed from parens
  meaning: string;
  note?: string;
};

export type LanguagesOfTheDay = {
  frenchWord: Phrase | null;
  frenchPhrase: Phrase | null;
  chineseWord: Phrase | null;
  chinesePhrase: Phrase | null;
};

export const LANGUAGES_FILE = "command-center/languages.md";

const SEED = `# Languages

Two tracks per language: single words/expressions, and full phrases/sentences.
The dashboard shows one of each daily — four total. Click any row in the
Inspired tab to hear it spoken.

Format: \`- text | meaning | optional note\`. For Chinese, put the pinyin in
parens after the characters: \`- 加油 (jiā yóu) | keep going | motivational\`.

## French Words

- ça marche | sounds good, that works | agreement
- du coup | so, therefore | filler
- bof | meh | dismissive
- bref | in short | conversation
- voilà | there you go | confirmation
- enfin | finally / well, anyway | filler
- carrément | totally, absolutely | emphasis
- franchement | honestly | candor
- d'ailleurs | by the way | conversation
- pourtant | yet, however | contrast
- quand même | still, anyway | resignation
- chouette | nice, cool | casual
- ouais | yeah | casual
- nickel | perfect | satisfaction
- débrouillard | resourceful | personality
- ras-le-bol | fed up | emotion
- bouquin | book | slang
- truc | thing, stuff | filler
- gosse | kid | casual
- bosser | to work hard | slang verb

## French Phrases

- Je ne sais pas par où commencer. | I don't know where to start. | overwhelmed
- Petit à petit, l'oiseau fait son nid. | Little by little, the bird builds its nest. | proverb
- Ça vaut le coup d'essayer. | It's worth a try. | encouragement
- On verra bien. | We'll see. | wait-and-see
- Je vais y réfléchir. | I'll think about it. | useful
- Ce n'est pas la peine. | It's not worth the trouble. | dismissal
- Je m'en occupe. | I'll take care of it. | commitment
- Tu as raison. | You're right. | agreement
- À quoi bon ? | What's the point? | resignation
- Ça me fait plaisir. | It makes me happy. / I'm glad. | warmth
- Il faut que je m'y mette. | I need to get to it. | self-talk
- Chaque chose en son temps. | Everything in its own time. | patience
- On n'est jamais mieux servi que par soi-même. | If you want something done right, do it yourself. | proverb
- Je suis crevé. | I'm exhausted. | feeling
- Reste sur tes gardes. | Stay on your guard. | warning

## Chinese Words

- 加油 (jiā yóu) | keep going / go for it | motivational
- 努力 (nǔ lì) | to work hard, effort | virtue
- 慢慢 (màn màn) | slowly | rhythm
- 厉害 (lì hài) | impressive, formidable | praise
- 当然 (dāng rán) | of course | agreement
- 其实 (qí shí) | actually | filler
- 也许 (yě xǔ) | maybe, perhaps | hedge
- 麻烦 (má fán) | trouble, hassle | useful
- 习惯 (xí guàn) | habit, to be used to | concept
- 机会 (jī huì) | opportunity | concept
- 经验 (jīng yàn) | experience | concept
- 简单 (jiǎn dān) | simple | adjective
- 复杂 (fù zá) | complicated | adjective
- 坚持 (jiān chí) | to persist | virtue
- 放松 (fàng sōng) | to relax | self-care
- 顺便 (shùn biàn) | by the way | conversation
- 大概 (dà gài) | approximately, probably | hedge
- 真的 (zhēn de) | really, truly | emphasis
- 突然 (tū rán) | suddenly | time
- 重要 (zhòng yào) | important | adjective

## Chinese Phrases

- 千里之行，始于足下 (qiān lǐ zhī xíng, shǐ yú zú xià) | a thousand-mile journey begins with a single step | proverb
- 万事开头难 (wàn shì kāi tóu nán) | all beginnings are hard | proverb
- 慢慢来，别急 (màn màn lái, bié jí) | take your time, don't rush | calming
- 我尽力了 (wǒ jìn lì le) | I did my best | reflection
- 你说得对 (nǐ shuō de duì) | you're right | agreement
- 我们谈一谈吧 (wǒ men tán yì tán ba) | let's talk it over | useful
- 这是个好主意 (zhè shì ge hǎo zhǔ yi) | that's a good idea | praise
- 我需要休息一下 (wǒ xū yào xiū xi yí xià) | I need to take a break | self-care
- 没什么大不了的 (méi shén me dà bù liǎo de) | it's no big deal | reassurance
- 让我想一想 (ràng wǒ xiǎng yi xiǎng) | let me think about it | useful
- 一步一个脚印 (yí bù yí ge jiǎo yìn) | one step at a time, leaving a footprint each time | proverb
- 失败是成功之母 (shī bài shì chéng gōng zhī mǔ) | failure is the mother of success | proverb
- 我有点紧张 (wǒ yǒu diǎn jǐn zhāng) | I'm a little nervous | feeling
- 你能帮我一下吗 (nǐ néng bāng wǒ yí xià ma) | can you help me? | useful
- 别担心，会好的 (bié dān xīn, huì hǎo de) | don't worry, it'll be okay | reassurance
`;

async function ensureFile(app: App): Promise<TFile> {
  const np = normalizePath(LANGUAGES_FILE);
  const existing = app.vault.getAbstractFileByPath(np);
  if (existing instanceof TFile) return existing;
  const folder = np.substring(0, np.lastIndexOf("/"));
  if (folder && !app.vault.getAbstractFileByPath(folder)) {
    await app.vault.createFolder(folder).catch(() => {});
  }
  return app.vault.create(np, SEED);
}

type SectionKey = "frWords" | "frPhrases" | "zhWords" | "zhPhrases";

function parseFile(text: string): Record<SectionKey, Phrase[]> {
  const out: Record<SectionKey, Phrase[]> = {
    frWords: [], frPhrases: [], zhWords: [], zhPhrases: [],
  };
  const lines = text.split(/\r?\n/);
  let section: SectionKey | null = null;
  for (const raw of lines) {
    const line = raw.trim();
    const h = line.match(/^##\s+(.+)$/i);
    if (h) {
      const t = h[1].toLowerCase();
      if (t.startsWith("french") && t.includes("word")) section = "frWords";
      else if (t.startsWith("french") && t.includes("phrase")) section = "frPhrases";
      else if (t.startsWith("chinese") && t.includes("word")) section = "zhWords";
      else if (t.startsWith("chinese") && t.includes("phrase")) section = "zhPhrases";
      else section = null;
      continue;
    }
    if (!section) continue;
    const m = line.match(/^-\s+(.+)$/);
    if (!m) continue;
    const parts = m[1].split("|").map((p) => p.trim());
    if (parts.length < 2) continue;
    const phraseRaw = parts[0];
    const meaning = parts[1];
    const note = parts[2] || undefined;
    let text = phraseRaw;
    let pronunciation: string | undefined;
    const pin = phraseRaw.match(/^(\S.*?)\s*\(([^)]+)\)\s*$/);
    if (pin && (section === "zhWords" || section === "zhPhrases")) {
      text = pin[1].trim();
      pronunciation = pin[2].trim();
    }
    out[section].push({ text, pronunciation, meaning, note });
  }
  return out;
}

function dailyHash(seed: string, date = new Date()): number {
  const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${seed}`;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pickDaily<T>(arr: T[], seed: string): T | null {
  if (arr.length === 0) return null;
  return arr[dailyHash(seed) % arr.length];
}

export async function loadLanguagesOfTheDay(app: App): Promise<LanguagesOfTheDay> {
  try {
    const file = await ensureFile(app);
    const text = await app.vault.read(file);
    const parsed = parseFile(text);
    return {
      frenchWord:    pickDaily(parsed.frWords,    "fr-word"),
      frenchPhrase:  pickDaily(parsed.frPhrases,  "fr-phrase"),
      chineseWord:   pickDaily(parsed.zhWords,    "zh-word"),
      chinesePhrase: pickDaily(parsed.zhPhrases,  "zh-phrase"),
    };
  } catch (e) {
    console.warn("[command-center] languages load failed:", e);
    return { frenchWord: null, frenchPhrase: null, chineseWord: null, chinesePhrase: null };
  }
}
