// tools/compile-mood-rules.cjs
// Dev-only: read assets/Mood History.xlsx -> write app/data/mood_rules.json (robust header finder + verbose logs)

const fs = require('fs');
const path = require('path');

let XLSX;
try { XLSX = require('xlsx'); }
catch(e){ console.error('❌ Missing dev dependency "xlsx". Run: npm i -D xlsx'); process.exit(1); }

const EXCEL_PATH = path.resolve(process.cwd(), 'assets', 'Mood History.xlsx');
const OUT_JSON   = path.resolve(process.cwd(), 'tools', 'data', 'mood_rules.json');

const norm  = (s) => String(s || '').trim();
const lower = (s) => norm(s).toLowerCase();
const clean = (s) => lower(s).replace(/[^a-z0-9]+/g,''); // remove spaces & symbols: "Day  4" -> "day4"

const REAL_TO_MOODN = {
  happy:'Mood 1', calm:'Mood 1', excited:'Mood 1',
  sad:'Mood 2', neutral:'Mood 2', anxious:'Mood 2', sorrow:'Mood 2',
  angry:'Mood 3', tired:'Mood 4', sick:'Mood 5',
};
const EMOJI_TO_REAL = {
  '😊':'happy','😐':'neutral','😢':'sad','😡':'angry','🥱':'tired','🤒':'sick'
};

function toMoodN(input) {
  const raw = norm(input);
  const m = /^mood\s*([1-5])$/i.exec(raw);
  if (m) return `Mood ${m[1]}`;
  if (EMOJI_TO_REAL[raw]) return REAL_TO_MOODN[EMOJI_TO_REAL[raw]] || 'Mood 2';
  return REAL_TO_MOODN[lower(raw)] || 'Mood 2';
}
const key5 = (a) => a.join('|');

function findHeaderRowArrays(ws) {
  // Read first sheet as array-of-arrays
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });
  // Look for a row that contains Day1..Day5 and Conclusion columns
  for (let i = 0; i < Math.min(rows.length, 50); i++) {
    const arr = rows[i].map(x => clean(String(x)));
    const hasDay1 = arr.some(c => /^day0*1$/.test(c));
    const hasDay2 = arr.some(c => /^day0*2$/.test(c));
    const hasDay3 = arr.some(c => /^day0*3$/.test(c));
    const hasDay4 = arr.some(c => /^day0*4$/.test(c));
    const hasDay5 = arr.some(c => /^day0*5$/.test(c));
    const hasConc = arr.some(c => /^(conclusionday0*6|conculusionday0*6|conclusion|day0*6)$/.test(c));
    if (hasDay1 && hasDay2 && hasDay3 && hasDay4 && hasDay5 && hasConc) {
      return { headerIndex: i, headerArray: rows[i] };
    }
  }
  return null;
}

function headerKeyFlexible(headerArray, guesses) {
  // Return the actual header text whose cleaned version matches any guess (cleaned)
  const cleanedMap = headerArray.map(h => ({ raw: String(h||''), c: clean(String(h||'')) }));
  for (const g of guesses) {
    const gc = clean(g);
    const hit = cleanedMap.find(h => h.c === gc);
    if (hit) return hit.raw;
  }
  return null;
}

(function main() {
  console.log('🔎 Excel path:', EXCEL_PATH);
  if (!fs.existsSync(EXCEL_PATH)) {
    console.error('❌ Excel not found. Ensure file exists at assets/Mood History.xlsx (watch .xlsx extension).');
    process.exit(1);
  }

  const wb = XLSX.readFile(EXCEL_PATH);
  console.log('📄 Sheets:', wb.SheetNames.join(', '));

  let best = null;

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const headerInfo = findHeaderRowArrays(ws);
    if (!headerInfo) {
      console.log(`— Skipping sheet "${sheetName}" (no header row with Day1..Day5 + Conclusion)`);
      continue;
    }
    console.log(`✅ Using sheet "${sheetName}" header row index: ${headerInfo.headerIndex}`);
    // Reparse with that header row as keys
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '', range: headerInfo.headerIndex, header: headerInfo.headerArray });

    // Build flexible header names based on the actual header row
    const H = headerInfo.headerArray;
    const d1k = headerKeyFlexible(H, ['Day 1','Day1']);
    const d2k = headerKeyFlexible(H, ['Day 2','Day2']);
    const d3k = headerKeyFlexible(H, ['Day 3','Day3']);
    const d4k = headerKeyFlexible(H, ['Day 4','Day4','Day  4']);
    const d5k = headerKeyFlexible(H, ['Day 5','Day5']);
    const ck  = headerKeyFlexible(H, ['Conclusion Day 6','Conculusion Day 6','Conclusion','Day 6']);
    const pk  = headerKeyFlexible(H, ['Percentage %','Percentage','%']);
    const rk  = headerKeyFlexible(H, ['Reason']);

    console.log('🧭 Detected headers:', { d1k, d2k, d3k, d4k, d5k, ck, pk, rk });

    if (!d1k || !d2k || !d3k || !d4k || !d5k || !ck) {
      console.log('— Missing required headers on this sheet, continue…');
      continue;
    }

    // Extract rules
    const out = {};
    let added = 0;
    for (const row of rows) {
      const d1 = toMoodN(row[d1k]);
      const d2 = toMoodN(row[d2k]);
      const d3 = toMoodN(row[d3k]);
      const d4 = toMoodN(row[d4k]);
      const d5 = toMoodN(row[d5k]);
      const concl = toMoodN(row[ck]);
      if (!d1 || !d2 || !d3 || !d4 || !d5 || !concl) continue;

      let pct = 0.66;
      const rawPct = norm(row[pk || '']);
      if (rawPct) {
        const m = /([\d.]+)/.exec(rawPct);
        if (m) { const v = parseFloat(m[1]); pct = v>1 ? v/100 : v; }
      }
      const reason = norm(row[rk || '']) || 'From Excel rule';

      out[key5([d1,d2,d3,d4,d5])] = { pred: concl, pct, reason };
      added++;
    }

    best = best && best.added > added ? best : { out, added, sheetName };
  }

  if (!best) {
    console.error('❌ No sheet produced rules. Make sure one sheet has headers: Day 1..Day 5 + Conclusion Day 6 (+ Percentage %, Reason).');
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(best.out, null, 2), 'utf8');
  console.log(`✅ Wrote ${OUT_JSON} from sheet "${best.sheetName}" with ${best.added} rules`);
})();
