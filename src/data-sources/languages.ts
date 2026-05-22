/**
 * Languages of the day — French + Chinese phrase pairs, daily-rotated.
 *
 * Source: `command-center/languages.md` in the vault. User-editable —
 * add phrases over time and the rotation gets richer.
 *
 * File format (markdown table or simple block list):
 *
 *   ## French
 *   - bonjour | hello | greeting
 *   - se débrouiller | to figure it out, to manage | useful verb
 *
 *   ## Chinese
 *   - 你好 (nǐ hǎo) | hello | greeting
 *   - 加油 (jiā yóu) | keep going / go for it | motivational
 *
 * One line per phrase. Pipe-separated. Sections are headed by `## French`
 * or `## Chinese` (case-insensitive). Trailing notes column is optional.
 */

import { App, normalizePath, TFile } from "obsidian";

export type Phrase = {
  text: string;             // the phrase in its native script
  pronunciation?: string;   // for Chinese, the pinyin (already in text or split)
  meaning: string;
  note?: string;
};

export type LanguagesOfTheDay = {
  french: Phrase[];
  chinese: Phrase[];
};

export const LANGUAGES_FILE = "command-center/languages.md";

const SEED = `# Languages

One phrase per line. Pipe-separated: \`phrase | meaning | optional note\`.
Add as many as you want — the dashboard rotates a fresh pair daily.

For Chinese, include the pinyin in parentheses after the characters so the
dashboard can show pronunciation: \`你好 (nǐ hǎo) | hello | greeting\`.

## French

- bonjour | hello | greeting
- merci beaucoup | thank you very much | polite
- comment ça va ? | how are you? | casual
- je vais bien | I'm doing well | response
- on y va | let's go | colloquial
- à plus tard | see you later | parting
- ça marche | sounds good, that works | agreement
- pas de souci | no worries | reassurance
- je ne sais pas | I don't know | useful
- au fait | by the way | conversation
- du coup | so, therefore | filler
- bien sûr | of course | agreement
- petit à petit | little by little | rhythm
- ça vaut le coup | it's worth it | reflective
- se débrouiller | to manage, figure it out | verb
- en fait | actually, in fact | filler
- je vous en prie | you're welcome / please | formal
- tant pis | too bad, oh well | acceptance
- d'accord | okay, agreed | agreement
- à tout à l'heure | see you in a bit | parting

## Chinese

- 你好 (nǐ hǎo) | hello | greeting
- 谢谢 (xiè xie) | thank you | polite
- 不客气 (bú kè qi) | you're welcome | response
- 加油 (jiā yóu) | keep going / go for it | motivational
- 我不知道 (wǒ bù zhī dào) | I don't know | useful
- 慢慢来 (màn màn lái) | take your time | calming
- 没问题 (méi wèn tí) | no problem | reassurance
- 一步一步 (yí bù yí bù) | step by step | rhythm
- 怎么了 (zěn me le) | what's up / what happened? | casual
- 真的吗 (zhēn de ma) | really? | reaction
- 听起来不错 (tīng qǐ lái bú cuò) | sounds good | agreement
- 我同意 (wǒ tóng yì) | I agree | useful
- 再见 (zài jiàn) | goodbye | parting
- 明天见 (míng tiān jiàn) | see you tomorrow | parting
- 别担心 (bié dān xīn) | don't worry | reassurance
- 我懂了 (wǒ dǒng le) | I get it / I understand now | useful
- 努力 (nǔ lì) | to work hard, effort | virtue
- 加倍努力 (jiā bèi nǔ lì) | redouble your efforts | motivational
- 万事开头难 (wàn shì kāi tóu nán) | all beginnings are hard | proverb
- 千里之行，始于足下 (qiān lǐ zhī xíng, shǐ yú zú xià) | a thousand-mile journey begins with a single step | proverb
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

function parseFile(text: string): { french: Phrase[]; chinese: Phrase[] } {
  const lines = text.split(/\r?\n/);
  let section: "french" | "chinese" | null = null;
  const french: Phrase[] = [];
  const chinese: Phrase[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    const heading = line.match(/^##\s+(\w+)/i);
    if (heading) {
      const h = heading[1].toLowerCase();
      if (h === "french") section = "french";
      else if (h === "chinese") section = "chinese";
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
    // For Chinese, split out pinyin if it's in (parens) inside the text.
    let text = phraseRaw;
    let pronunciation: string | undefined;
    const pin = phraseRaw.match(/^(\S.*?)\s*\(([^)]+)\)\s*$/);
    if (pin && section === "chinese") {
      text = pin[1].trim();
      pronunciation = pin[2].trim();
    }
    (section === "french" ? french : chinese).push({ text, pronunciation, meaning, note });
  }
  return { french, chinese };
}

function dailyHash(seed: string, date = new Date()): number {
  const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${seed}`;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Pick one French + one Chinese phrase for today. Deterministic per-date so
 * the surface stays stable; both languages rotate independently.
 */
export async function loadLanguagesOfTheDay(app: App): Promise<LanguagesOfTheDay> {
  try {
    const file = await ensureFile(app);
    const text = await app.vault.read(file);
    const { french, chinese } = parseFile(text);
    const pickFr = french.length ? [french[dailyHash("fr") % french.length]] : [];
    const pickZh = chinese.length ? [chinese[dailyHash("zh") % chinese.length]] : [];
    return { french: pickFr, chinese: pickZh };
  } catch (e) {
    console.warn("[command-center] languages load failed:", e);
    return { french: [], chinese: [] };
  }
}
