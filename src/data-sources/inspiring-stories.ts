/**
 * Inspiring story of the day — bite-size biographical highlights.
 *
 * Source: `command-center/inspiring-stories.md` in the vault. User-editable.
 *
 * Each story is a single block:
 *
 *   ## Marie Curie — discovered radium in a leaky shed
 *
 *   Field: Physics, Chemistry
 *   Era: 1898
 *
 *   Working in a converted shed with no funding, the Curies isolated
 *   radium from tons of pitchblende ore. She'd later say the conditions
 *   were so bad that "we had no money, no laboratory, no help."
 *
 *   > Lack of resources isn't the limit. Lack of obsession is.
 *
 * Headings are `## Subject — short hook`. Field/Era are optional metadata
 * lines under the heading. Body is one or two paragraphs. The `>` blockquote
 * is the takeaway lesson — surfaced as a pull-quote in the card.
 *
 * Daily picker is deterministic by date so the surface is stable all day,
 * then rotates fresh tomorrow.
 */

import { App, normalizePath, TFile } from "obsidian";

export type InspiringStory = {
  subject: string;          // before the em-dash
  hook: string;             // after the em-dash, the punchy line
  field?: string;
  era?: string;
  body: string[];           // paragraphs
  lesson?: string;          // pull-quote (from the `>` line)
};

export const STORIES_FILE = "command-center/inspiring-stories.md";

const SEED = `# Inspiring stories

Bite-size biographical highlights — discovery, resilience, obsession,
unreasonable belief. Add your own at any time. The dashboard rotates one
per day.

Format per entry:
- Heading: \`## Subject — hook\` (the em-dash separates the name from the
  one-line headline). Use a real em-dash \`—\`, not a hyphen.
- Optional \`Field:\` and \`Era:\` lines.
- One or two paragraphs of body.
- Optional \`> Lesson...\` blockquote at the end — surfaced as a pull-quote.

---

## Marie Curie — discovered radium in a converted shed

Field: Physics, Chemistry
Era: 1898

Working in a leaky, unheated shed at the École de Physique, Marie and
Pierre Curie spent four years processing tons of pitchblende by hand to
isolate a single decigram of radium. She later wrote that they had "no
money, no laboratory, and no help." She is the only person to win Nobel
Prizes in two different sciences.

> The conditions don't decide. The obsession does.

## Viktor Frankl — wrote a book outline in Auschwitz

Field: Psychiatry, Philosophy
Era: 1942–1945

Frankl was imprisoned in four Nazi concentration camps. He survived in
part by mentally reconstructing the manuscript of his book — a theory of
meaning he'd been working on before the war. After liberation he wrote
it in nine days. Man's Search for Meaning has sold over sixteen million
copies. He gave the manuscript away for free for decades.

> When you can't choose your circumstances, choose your stance toward them.

## Stephen Hawking — given two years to live, worked for fifty-five more

Field: Theoretical physics
Era: 1963 diagnosis

Diagnosed with ALS at 21 and told he had two years, Hawking enrolled in
a PhD anyway. He lost the use of his hands, then his voice, then nearly
every muscle. He kept producing — Hawking radiation, A Brief History of
Time, decades of papers — by manipulating a single cheek muscle to drive
a speech synthesizer. He died in 2018 at 76.

> A prognosis is a probability, not a sentence.

## Frida Kahlo — painted from a hospital bed

Field: Art
Era: 1925 onward

At 18, Kahlo was nearly killed when a streetcar struck her bus — a metal
handrail pierced her abdomen. She spent months in a body cast. Her mother
rigged a mirror above her bed and an easel she could reach lying down.
She painted herself, because "I am the subject I know best." She produced
more than 140 paintings over the next 30 years, most of them self-portraits.

> Constraints aren't subtraction. They're a frame.

## Nelson Mandela — read a book on a quarry every day for 27 years

Field: Activism, statesmanship
Era: 1964–1990

Mandela served 27 years in prison, much of it on Robben Island breaking
limestone in a quarry. He studied law by correspondence, taught fellow
prisoners, refused to bend to early-release offers that came with
conditions. He emerged at 71 — and within four years was president of
the country that imprisoned him.

> Patience is not waiting. It's working through the waiting.

## Helen Keller — learned twenty-five words in a month at age seven

Field: Activism, writing
Era: 1887

Blind and deaf from 19 months old, Keller spent her childhood cut off
from language. When Anne Sullivan arrived as her teacher, she spelled
"water" into Helen's hand while running the pump. In one moment Keller
understood that things had names. She learned 25 more words that month.
She would go on to graduate from Radcliffe and write twelve books.

> The fence between us and the world is often just the words we haven't met yet.

## Frederick Douglass — taught himself to read while enslaved

Field: Activism, oratory
Era: 1820s–1830s

As a young enslaved boy in Baltimore, Douglass was first taught letters
by his enslaver's wife — until her husband forbade it, saying education
would "spoil" him. Douglass took that as confirmation it was the path
out. He traded bread to poor white boys in exchange for reading lessons.
He learned. He escaped at 20. He became one of the most powerful orators
of the 19th century.

> The thing they don't want you to learn is the thing to learn first.

## Wright Brothers — built a flying machine in a bicycle shop

Field: Aeronautics
Era: 1900–1903

Wilbur and Orville ran a bicycle repair shop in Dayton, Ohio. They had
no engineering degrees, no funding, no patrons. They built their own wind
tunnel. They corrected the lift tables every published authority had
gotten wrong. On December 17, 1903, Orville flew 120 feet in 12 seconds
at Kitty Hawk. The world's papers ignored it for five years.

> You don't need the establishment to be right. You need to be right.

## Beethoven — composed his greatest work while deaf

Field: Music
Era: 1798 onward

Beethoven began losing his hearing in his late twenties. He considered
suicide — and chose work instead. He composed by feeling the piano's
vibrations through a rod clamped between his teeth and the soundboard.
He wrote the Ninth Symphony — possibly the most performed orchestral
work in history — when he could not hear a single note of it.

> The work doesn't ask whether you can perceive it.

## Jane Goodall — went into the field at 26 with no degree

Field: Primatology
Era: 1960

When Louis Leakey hired Goodall to study chimpanzees at Gombe, she had
no university degree and no formal training. The field's experts called
her methods amateur — she named the chimps instead of numbering them,
ascribed personalities, watched without interfering. Within months she
documented chimps using tools, demolishing the line scientists had drawn
between humans and other animals.

> Outsider status is a position, not a disadvantage.

## Nikola Tesla — sketched the AC motor while penniless

Field: Engineering
Era: 1881–1888

Tesla emigrated to America with four cents in his pocket and a letter
of introduction. He worked digging ditches for a while. Walking in a
Budapest park years earlier, he had seen the principle of the rotating
magnetic field appear to him whole — he sketched it in the dirt with a
stick. He carried the design in his head for years before he could
build it. It became the foundation of the modern AC power grid.

> Sometimes the idea arrives complete. The decade is just storage.

## Mary Anning — self-taught fossil hunter who rewrote paleontology

Field: Paleontology
Era: 1810s–1840s

Anning lived in Lyme Regis on the English coast and made her living
selling fossils to tourists. She had almost no formal schooling. At
twelve, she helped her brother dig the first complete ichthyosaur
skeleton. Over decades she found the first plesiosaur, the first British
pterosaur, and changed how Europe understood deep time. Geological
societies barred her from membership because she was a woman.

> Credentials and contribution are different things.

## Václav Havel — went from prison cell to presidential palace in months

Field: Writing, politics
Era: 1989–1990

Havel was a dissident playwright who spent years in Czechoslovak prisons
for writing essays the regime didn't like. In November 1989, the regime
collapsed. By December 29 — six weeks later — he was president of the
country. He wrote a famous line in one of those prison-era essays:
*"Hope is not the conviction that something will turn out well, but the
certainty that something makes sense, regardless of how it turns out."*

> The right work doesn't need to know whether it will win.

## Anne Frank — wrote a book that outlived the regime that killed her

Field: Writing
Era: 1942–1944

Frank was 13 when her family went into hiding in a sealed annex above
her father's office. She wrote in a diary for two years. She rewrote
parts after hearing a radio broadcast asking civilians to preserve their
testimony. She was deported to Bergen-Belsen and died at 15. Her father
survived. The diary has been translated into more than 70 languages and
read by tens of millions.

> The voice can outrun the cage. Sometimes by centuries.

## Toni Morrison — wrote her first novel at 39, between her kids' bedtimes

Field: Literature
Era: 1970 onward

Morrison was a single mother working full-time as an editor at Random
House. She wrote The Bluest Eye in the hours before her sons woke and
after they slept. She kept writing — Sula, Song of Solomon, Beloved.
She won the Pulitzer at 56 and the Nobel at 62. She told interviewers
she had no time, she just made time. "I get up at 5am."

> Late starts are starts. The clock doesn't care.

## Steve Jobs — fired by the company he founded, came back ten years later

Field: Technology
Era: 1985–1997

Jobs was forced out of Apple in 1985 after a board power struggle. He
called it the most painful event of his life — but also said later that
"the heaviness of being successful was replaced by the lightness of
being a beginner again." He started NeXT and bought Pixar. Apple bought
NeXT in 1996. He returned, the iMac shipped, then the iPod, the iPhone.
The company became the most valuable in the world.

> Getting fired from the work isn't getting fired from yourself.

## Malala Yousafzai — went back to school the year after being shot

Field: Activism
Era: 2012 onward

A Taliban gunman shot 15-year-old Malala in the head on her school bus
in Pakistan for advocating girls' education. She was airlifted to the
UK in critical condition. She survived multiple surgeries. By the next
school year she was back in a classroom — in Birmingham. Two years later
she became the youngest Nobel laureate. She still studies. She still
campaigns.

> Showing up is the political act.
`;

async function ensureFile(app: App): Promise<TFile> {
  const np = normalizePath(STORIES_FILE);
  const existing = app.vault.getAbstractFileByPath(np);
  if (existing instanceof TFile) return existing;
  const folder = np.substring(0, np.lastIndexOf("/"));
  if (folder && !app.vault.getAbstractFileByPath(folder)) {
    await app.vault.createFolder(folder).catch(() => {});
  }
  return app.vault.create(np, SEED);
}

/**
 * Parse the file into discrete story blocks. Each `## Heading` starts a
 * new story; we collect lines until the next `## ` or EOF.
 */
function parseStories(text: string): InspiringStory[] {
  const lines = text.split(/\r?\n/);
  const out: InspiringStory[] = [];
  let cur: { heading: string; body: string[] } | null = null;

  const flush = () => {
    if (!cur) return;
    const s = buildStory(cur.heading, cur.body);
    if (s) out.push(s);
    cur = null;
  };

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");
    // Skip top-level # header (the file title), separator, etc.
    if (/^#\s/.test(line)) { flush(); continue; }
    if (/^---+\s*$/.test(line)) { flush(); continue; }
    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      flush();
      cur = { heading: h2[1].trim(), body: [] };
      continue;
    }
    if (cur) cur.body.push(line);
  }
  flush();
  return out;
}

function buildStory(heading: string, bodyLines: string[]): InspiringStory | null {
  // Heading: "Subject — hook" (em-dash). Fall back to hyphen.
  let subject = heading;
  let hook = "";
  const emDash = heading.indexOf("—");
  const hyphenDash = heading.indexOf(" - ");
  if (emDash >= 0) {
    subject = heading.slice(0, emDash).trim();
    hook = heading.slice(emDash + 1).trim();
  } else if (hyphenDash >= 0) {
    subject = heading.slice(0, hyphenDash).trim();
    hook = heading.slice(hyphenDash + 3).trim();
  }

  let field: string | undefined;
  let era: string | undefined;
  let lesson: string | undefined;
  const paragraphs: string[] = [];
  let buf: string[] = [];

  const pushPara = () => {
    const p = buf.join(" ").trim();
    if (p) paragraphs.push(p);
    buf = [];
  };

  for (const raw of bodyLines) {
    const line = raw.trim();
    if (!line) { pushPara(); continue; }
    const fld = line.match(/^Field:\s*(.+)$/i);
    if (fld) { pushPara(); field = fld[1].trim(); continue; }
    const eraM = line.match(/^Era:\s*(.+)$/i);
    if (eraM) { pushPara(); era = eraM[1].trim(); continue; }
    const quote = line.match(/^>\s*(.+)$/);
    if (quote) { pushPara(); lesson = quote[1].trim(); continue; }
    buf.push(line);
  }
  pushPara();

  if (!subject || paragraphs.length === 0) return null;
  return { subject, hook, field, era, body: paragraphs, lesson };
}

function dailyHash(seed: string, date = new Date()): number {
  const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${seed}`;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export async function loadInspiringStory(app: App): Promise<InspiringStory | null> {
  try {
    const file = await ensureFile(app);
    const text = await app.vault.read(file);
    const stories = parseStories(text);
    if (stories.length === 0) return null;
    return stories[dailyHash("story") % stories.length];
  } catch (e) {
    console.warn("[command-center] inspiring-stories load failed:", e);
    return null;
  }
}
