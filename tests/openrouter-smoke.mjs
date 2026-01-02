import fs from 'node:fs/promises';
import path from 'node:path';

function nowStamp() {
  // Safe for filenames.
  return new Date().toISOString().replaceAll(':', '-');
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function loadDotEnv(dotenvPath) {
  if (!(await fileExists(dotenvPath))) return;
  const raw = await fs.readFile(dotenvPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();

    // Strip surrounding quotes.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) process.env[key] = value;
  }
}

function extractText(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part === 'object' && typeof part.text === 'string') return part.text;
        return '';
      })
      .join('');
  }
  return '';
}

function extractMarkdownLinks(text) {
  if (typeof text !== 'string' || !text) return [];
  const links = [];
  const re = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  let match;
  while ((match = re.exec(text))) {
    links.push({ label: match[1], url: match[2] });
  }
  // Dedupe by URL.
  const seen = new Set();
  return links.filter((l) => {
    if (seen.has(l.url)) return false;
    seen.add(l.url);
    return true;
  });
}

function extractUrlCitations(message) {
  const annotations = message && typeof message === 'object' ? message.annotations : undefined;
  if (!Array.isArray(annotations)) return [];

  return annotations
    .filter((a) => a && typeof a === 'object' && a.type === 'url_citation' && a.url_citation)
    .map((a) => {
      const c = a.url_citation;
      return {
        url: typeof c.url === 'string' ? c.url : null,
        title: typeof c.title === 'string' ? c.title : null,
        content: typeof c.content === 'string' ? c.content : null,
        start_index: typeof c.start_index === 'number' ? c.start_index : null,
        end_index: typeof c.end_index === 'number' ? c.end_index : null,
      };
    })
    .filter((c) => typeof c.url === 'string' && c.url.length > 0);
}

function extractWebCitations(message) {
  const urlCitations = extractUrlCitations(message);
  if (urlCitations.length) {
    return urlCitations.map((c) => ({ ...c, source: 'annotations' }));
  }

  // Fallback: if the model includes citations as markdown links in content.
  const content = message && typeof message === 'object' ? message.content : undefined;
  const text = extractText(content);
  const links = extractMarkdownLinks(text);
  return links.map((l) => ({
    url: l.url,
    title: l.label,
    content: null,
    start_index: null,
    end_index: null,
    source: 'markdown',
  }));
}

function parseDataUrl(dataUrl) {
  // data:image/png;base64,....
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  const mime = match[1];
  const base64 = match[2];
  return { mime, base64 };
}

async function openRouterCall({ apiKey, body }) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      // Optional attribution header.
      'X-Title': 'starter-kit-electron-app (tests)',
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    // leave null
  }

  if (!res.ok) {
    const msg = json?.error?.message;
    throw new Error(`OpenRouter HTTP ${res.status}${msg ? `: ${msg}` : `: ${text.slice(0, 200)}`}`);
  }

  return json;
}

async function main() {
  const repoRoot = process.cwd();
  await loadDotEnv(path.join(repoRoot, '.env'));

  const apiKey =
    process.env.OPENROUTER_API_KEY ||
    process.env.OPENROUTER_KEY ||
    process.env.OPENROUTER_API_TOKEN;

  const textModel =
    process.env.OPENROUTER_TEXT_MODEL ||
    process.env.TEXT_MODEL ||
    'openai/gpt-5.2-chat';

  const imageModel =
    process.env.OPENROUTER_IMAGE_MODEL ||
    process.env.IMAGE_MODEL ||
    'google/gemini-3-pro-image-preview';

  if (!apiKey) {
    throw new Error(
      'Missing OPENROUTER_API_KEY (or OPENROUTER_KEY / OPENROUTER_API_TOKEN) in environment/.env'
    );
  }

  const outRoot = path.join(repoRoot, 'tests', 'out');
  const runDir = path.join(outRoot, `openrouter-${nowStamp()}`);
  await fs.mkdir(runDir, { recursive: true });

  const summary = {
    startedAt: new Date().toISOString(),
    outputsDir: path.relative(repoRoot, runDir),
    text: { model: textModel, ok: false, contentLength: 0, urlCitations: 0 },
    image: { model: imageModel, ok: false, images: 0, contentLength: 0 },
  };

  // 1) Text model
  try {
    const textBody = {
      model: summary.text.model,
      // Explicitly enable web search plugin (even if using a :online model).
      // https://openrouter.ai/docs/guides/features/plugins/web-search
      plugins: [
        {
          id: 'web',
          max_results: 3,
        },
      ],
      messages: [
        {
          role: 'user',
          content:
            "Use web search. What is the current weather in Madrid, Spain right now? Give 3 short bullets and include at least 2 citations as markdown links (e.g. [example.com](https://example.com/...)).",
        },
      ],
    };

    const textJson = await openRouterCall({ apiKey, body: textBody });
    await fs.writeFile(path.join(runDir, 'text-response.json'), JSON.stringify(textJson, null, 2));

    const msg = textJson?.choices?.[0]?.message;
    const content = extractText(msg?.content);
    const urlCitations = extractWebCitations(msg);

    summary.text.ok = true;
    summary.text.contentLength = content.length;
    summary.text.urlCitations = urlCitations.length;

    await fs.writeFile(
      path.join(runDir, 'text-web-citations.json'),
      JSON.stringify(urlCitations, null, 2)
    );

    await fs.writeFile(
      path.join(runDir, 'text-extracted.txt'),
      content ? `${content}\n` : ''
    );
  } catch (err) {
    summary.text.ok = false;
    await fs.writeFile(
      path.join(runDir, 'text-error.txt'),
      `${err instanceof Error ? err.stack || err.message : String(err)}\n`
    );
  }

  // 2) Image model
  try {
    const imageBody = {
      model: summary.image.model,
      messages: [
        {
          role: 'user',
          content:
            'Generate a warm, cheerful illustration of a happy puppy greeting a family returning home from the beach. Golden-hour lighting, sandy footprints, beach towels and a surfboard near the doorway, friendly vibe. ONLY RETURN 1 IMAGE.',
        },
      ],
      modalities: ['image', 'text'],
    };

    const imageJson = await openRouterCall({ apiKey, body: imageBody });
    await fs.writeFile(path.join(runDir, 'image-response.json'), JSON.stringify(imageJson, null, 2));

    const msg = imageJson?.choices?.[0]?.message;
    const content = extractText(msg?.content);

    const images = Array.isArray(msg?.images) ? msg.images : [];
    const urls = images
      .map((img) => img?.image_url?.url)
      .filter((u) => typeof u === 'string');

    summary.image.ok = true;
    summary.image.images = urls.length;
    summary.image.contentLength = content.length;

    if (content) {
      await fs.writeFile(path.join(runDir, 'image-extracted.txt'), `${content}\n`);
    }

    // Save each returned data URL as a file (usually PNG) when possible.
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const parsed = parseDataUrl(url);
      if (!parsed) continue;

      const ext = parsed.mime === 'image/png' ? 'png' : parsed.mime === 'image/jpeg' ? 'jpg' : 'bin';
      const buf = Buffer.from(parsed.base64, 'base64');
      await fs.writeFile(path.join(runDir, `image-${i + 1}.${ext}`), buf);
    }
  } catch (err) {
    summary.image.ok = false;
    await fs.writeFile(
      path.join(runDir, 'image-error.txt'),
      `${err instanceof Error ? err.stack || err.message : String(err)}\n`
    );
  }

  await fs.writeFile(path.join(runDir, 'summary.json'), JSON.stringify(summary, null, 2));

  // Minimal console output (no secrets, no base64).
  console.log('OpenRouter smoke test complete');
  console.log(`Outputs: ${summary.outputsDir}`);
  console.log(
    `Text: ${summary.text.ok ? 'OK' : 'FAIL'} (${summary.text.model}) len=${summary.text.contentLength} citations=${summary.text.urlCitations}`
  );
  console.log(
    `Image: ${summary.image.ok ? 'OK' : 'FAIL'} (${summary.image.model}) images=${summary.image.images} len=${summary.image.contentLength}`
  );

  if (!summary.text.ok || !summary.image.ok) {
    process.exitCode = 1;
  }
}

await main();
