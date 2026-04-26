const SOURCE_URL = "https://pollenvarsel.naaf.no/charts/forecast";
const REGION = "Rogaland";

function decodeHtml(value) {
  return String(value || "")
    .replace(/&aring;/gi, "å")
    .replace(/&oslash;/gi, "ø")
    .replace(/&aelig;/gi, "æ")
    .replace(/&Aring;/g, "Å")
    .replace(/&Oslash;/g, "Ø")
    .replace(/&AElig;/g, "Æ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
}

function stripTags(value) {
  return decodeHtml(String(value || "").replace(/<[^>]+>/g, ""))
    .replace(/Ã¥/g, "å")
    .replace(/Ã¸/g, "ø")
    .replace(/Ã¦/g, "æ")
    .replace(/Ã…/g, "Å")
    .replace(/Ã˜/g, "Ø")
    .replace(/Ã†/g, "Æ")
    .trim();
}

function parseForecast(html) {
  const regionIndex = html.indexOf(`<h3>${REGION}</h3>`);
  if (regionIndex === -1) throw new Error(`Fant ikke region ${REGION}`);

  const nextRegionIndex = html.indexOf("<h3>", regionIndex + 1);
  const regionHtml = html.slice(regionIndex, nextRegionIndex === -1 ? html.length : nextRegionIndex);
  const todayMatch = regionHtml.match(/<h4[^>]*>\s*I dag\s*<\/h4>([\s\S]*?)(?:<h4[^>]*>\s*I morgen\s*<\/h4>|<\/details>)/i);
  if (!todayMatch) throw new Error("Fant ikke dagens pollenvarsel");

  const itemRegex = /<span[^>]*pollenName[^>]*>([\s\S]*?)<\/span>[\s\S]*?<span[^>]*level-(\d+)[^>]*><\/span>[\s\S]*?<span[^>]*pollenText[^>]*>([\s\S]*?)<\/span>/gi;
  const items = [];
  let match;
  while ((match = itemRegex.exec(todayMatch[1])) !== null) {
    const name = stripTags(match[1]);
    const level = Number(match[2]);
    const levelText = stripTags(match[3]);
    if (name) items.push({ name, level, levelText });
  }

  if (!items.length) throw new Error("Fant ingen pollenverdier");

  const maxLevel = Math.max(...items.map(item => item.level));
  const active = items.filter(item => item.level > 0);
  const strongest = items.filter(item => item.level === maxLevel && maxLevel > 0);
  const summary = strongest.length
    ? `${strongest.map(item => item.name).join(", ")} ${strongest[0].levelText.toLowerCase()}`
    : "Ingen";

  return {
    source: "NAAF",
    region: REGION,
    day: "I dag",
    summary,
    maxLevel,
    active,
    items,
    updatedAt: new Date().toISOString()
  };
}

export async function onRequestGet() {
  try {
    const res = await fetch(SOURCE_URL, {
      headers: {
        "accept": "text/html",
        "user-agent": "Vaermelding-for-infoskjermer/1.0"
      },
      cf: { cacheTtl: 1800, cacheEverything: true }
    });

    if (!res.ok) throw new Error(`NAAF svarte HTTP ${res.status}`);

    const html = await res.text();
    return Response.json(parseForecast(html), {
      headers: {
        "cache-control": "public, max-age=900"
      }
    });
  } catch (error) {
    return Response.json(
      { error: String(error?.message || error), source: "NAAF", region: REGION },
      { status: 502, headers: { "cache-control": "no-store" } }
    );
  }
}
