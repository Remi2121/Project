import RingProgress from '@/components/RingProgress';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { db } from 'utils/firebaseConfig';

// Config
const TZ = 'Asia/Colombo';
const SOURCE_COLLECTION = 'MoodHistory';
const SOURCE_TIME_FIELD = 'createdAt';

// Types
type RealMood = 'happy' | 'sad' | 'angry' | 'tired' | 'sick' | 'neutral' | 'calm' | 'excited' | 'anxious';
type Rule = { pred: string; pct: number; reason: string };
type RuleMap = Record<string, Rule>;

// Load  rules (JSON)

const RULES: RuleMap = require('../../../tools/data/mood_rules.json');

//Mappings
const EMOJI_TO_REAL: Record<string, RealMood> = {
  '😊': 'happy', '😐': 'neutral', '😢': 'sad', '😡': 'angry', '🥱': 'tired', '🤒': 'sick'
};

const REAL_TO_MOODN: Record<string, string> = {
  happy: 'Mood 1', calm: 'Mood 1', excited: 'Mood 1',neutral: 'Mood 1',
  sad: 'Mood 2', anxious: 'Mood 2', sorrow: 'Mood 2',
  angry: 'Mood 3',
  tired: 'Mood 4',
  sick: 'Mood 5',
};

const MOODN_TO_REAL: Record<string, RealMood> = {
  'Mood 1': 'happy', 'Mood 2': 'sad', 'Mood 3': 'angry', 'Mood 4': 'tired', 'Mood 5': 'sick',
};

// Time helpers (TZ safe) 
function toDayKeyTZ(d: Date, tz = TZ) {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' });
  return fmt.format(d); // YYYY-MM-DD
}
function startOfDayTZ(d: Date, tz = TZ) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(d).reduce((a, p) => (a[p.type] = p.value, a), {} as any);
  return new Date(Date.UTC(+parts.year, +parts.month - 1, +parts.day, 0, 0, 0));
}
function addDaysUTC(d: Date, n: number) { const x = new Date(d.getTime()); x.setUTCDate(x.getUTCDate() + n); return x; }

// Normalization
const norm = (s: any) => String(s || '').trim();
const lower = (s: any) => norm(s).toLowerCase();

function toRealMood(input: any): RealMood {
  if (!input) return 'neutral';
  const raw = norm(input);
  if (EMOJI_TO_REAL[raw]) return EMOJI_TO_REAL[raw];
  const k = lower(raw);
  if (k === 'happy' || k === 'joy' || k === 'good') return 'happy';
  if (k === 'neutral' || k === 'ok') return 'neutral';
  if (k === 'sad' || k === 'down' || k === 'sorrow') return 'sad';
  if (k === 'angry' || k === 'mad') return 'angry';
  if (k === 'tired' || k === 'sleepy') return 'tired';
  if (k === 'sick' || k === 'ill') return 'sick';
  return 'neutral';
}

function toMoodN(input: string) {
  const raw = norm(input);
  const m = /^mood\s*([1-5])$/i.exec(raw);
  if (m) return `Mood ${m[1]}`;
  return REAL_TO_MOODN[lower(input)] || 'Mood 2'; // default to Mood 2 bucket if unknown
}

const key5 = (a: string[]) => a.join('|');

// Reason helpers (strict) 
function findPctFromExcelReason(reason: string, predMoodN?: string): number | null {
  const entries = Object.values(RULES);
  for (const r of entries) {
    if (r.reason === reason && (!predMoodN || r.pred === predMoodN)) return r.pct;
  }
  for (const r of entries) {
    if (r.reason === reason) return r.pct;
  }
  if (predMoodN) {
    for (const r of entries) {
      if (r.reason?.toLowerCase?.().includes(reason.toLowerCase()) && r.pred === predMoodN) return r.pct;
    }
  }
  for (const r of entries) {
    if (r.reason?.toLowerCase?.().includes(reason.toLowerCase())) return r.pct;
  }
  return null;
}

function detectPatternReasonFromExcel(last5N: string[]): { predMoodN: string; reason: string; pct: number } | null {
  const [d1, d2, d3, d4, d5] = last5N;

  // All past days same mood
  if (last5N.every((x) => x === d5)) {
    const reason = 'All past days same mood';
    const pct = findPctFromExcelReason(reason, d5) ?? 1.0;
    return { predMoodN: d5, reason, pct };
  }

  // Last 3 days same mood
  if (d3 === d4 && d4 === d5) {
    const reason = 'Last 3 days same mood';
    const pct = findPctFromExcelReason(reason, d5) ?? 1.0;
    return { predMoodN: d5, reason, pct };
  }

  // Last 2 days repeating (d1=d2=d3 & d4=d5 & d3!=d4)
  if (d1 === d2 && d2 === d3 && d4 === d5 && d3 !== d4) {
    const reason = 'Last 2 days repeating';
    const pct = findPctFromExcelReason(reason, d5) ?? 0.9;
    return { predMoodN: d5, reason, pct };
  }

  // Last 2 days same mood
  if (d4 === d5) {
    const reason = 'Last 2 days same mood';
    const pct = findPctFromExcelReason(reason, d5) ?? 0.8;
    return { predMoodN: d5, reason, pct };
  }

  // Alternate pattern (d1=d3=d5 & d2=d4 & d1!=d2)
  if (d1 === d3 && d3 === d5 && d2 === d4 && d1 !== d2) {
    const reason = 'Alternate pattern';
    const pct = findPctFromExcelReason(reason, d1) ?? 0.7;
    return { predMoodN: d1, reason, pct };
  }

  // Start & end same mood
  if (d1 === d5) {
    const reason = 'Start & end same mood';
    const pct = findPctFromExcelReason(reason, d5) ?? 0.8;
    return { predMoodN: d5, reason, pct };
  }

  // Majority in last 5 → try Excel phrases (“Mostly Mood 4”, “Mood 2 majority”, or generic)
  const counts = new Map<string, number>();
  for (const x of last5N) counts.set(x, (counts.get(x) ?? 0) + 1);
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  if (sorted.length) {
    const [topMood, topCnt] = sorted[0];
    const second = sorted[1]?.[1] ?? 0;
    if (topCnt > second) {
      const reasonCandidates = [
        `Mostly ${topMood}`,
        `${topMood} majority`,
        'Mixed pattern, predicted majority mood',
      ];
      for (const r of reasonCandidates) {
        const pct = findPctFromExcelReason(r, topMood);
        if (pct != null) return { predMoodN: topMood, reason: r, pct };
      }
      const pct = findPctFromExcelReason('Mixed pattern, predicted majority mood') ?? 0.66;
      return { predMoodN: topMood, reason: 'Mixed pattern, predicted majority mood', pct };
    }
  }

  // Every-other day hint (use Excel-like phrasings if present)
  if (d2 === d4) {
    const pred = d2;
    const reasonCandidates = [
      `${pred} happened day after`,
      `${pred} repeats alternate`,
      'Mixed pattern, predicted majority mood',
    ];
    for (const r of reasonCandidates) {
      const pct = findPctFromExcelReason(r, pred);
      if (pct != null) return { predMoodN: pred, reason: r, pct };
    }
  }

  return null;
}

// Strict predictor (Only reasons) 
function predictFromRules(last5Real: RealMood[]) {
  const last5N = last5Real.map((m) => toMoodN(m));

  // 1) Exact sequence match in JSON
  const exact = RULES[key5(last5N)];
  if (exact) {
    return {
      moodReal: (MOODN_TO_REAL[exact.pred] || (exact.pred as RealMood)),
      pct: exact.pct,
      reason: exact.reason, // strictly from Excel
    };
  }

  // 2) Excel-like pattern
  const pat = detectPatternReasonFromExcel(last5N);
  if (pat) {
    return {
      moodReal: (MOODN_TO_REAL[pat.predMoodN] || (pat.predMoodN as RealMood)),
      pct: pat.pct,
      reason: pat.reason, // Excel phrasing
    };
  }

  // 3) Fallback (no Excel match at all)
  return {
    moodReal: (MOODN_TO_REAL[last5N[4]] || 'neutral'),
    pct: 0.6,
    reason: 'No matching rule in Excel (add this sequence in your sheet).',
  };
}

// Fetch & collapse to daily moods 
type DayRow = { key: string; date: Date; mood: RealMood };

async function loadLast5DailyMoods(): Promise<DayRow[]> {
  const today0 = startOfDayTZ(new Date());
  const start = addDaysUTC(today0, -(5 - 1));  // oldest day
  const end   = addDaysUTC(today0, 1);         // tomorrow 00:00

  try {
    const qRef = query(
      collection(db, SOURCE_COLLECTION),
      where(SOURCE_TIME_FIELD, '>=', Timestamp.fromDate(start)),
      where(SOURCE_TIME_FIELD, '<',  Timestamp.fromDate(end)),
      orderBy(SOURCE_TIME_FIELD, 'asc'),
    );
    const snap = await getDocs(qRef);
    return collapseSnapToDaily(snap.docs.map(d => d.data()));
  } catch {
    const all = await getDocs(collection(db, SOURCE_COLLECTION));
    const rows = all.docs
      .map(d => d.data())
      .filter((r: any) => {
        const t = r?.[SOURCE_TIME_FIELD];
        const dt: Date =
          t?.toDate?.() ? t.toDate() :
          (t instanceof Date ? t : new Date(t ?? 0));
        return dt >= start && dt < end;
      })
      .sort((a: any, b: any) => {
        const ta: Date = a?.[SOURCE_TIME_FIELD]?.toDate?.() ? a[SOURCE_TIME_FIELD].toDate() : new Date(a?.[SOURCE_TIME_FIELD] ?? 0);
        const tb: Date = b?.[SOURCE_TIME_FIELD]?.toDate?.() ? b[SOURCE_TIME_FIELD].toDate() : new Date(b?.[SOURCE_TIME_FIELD] ?? 0);
        return ta.getTime() - tb.getTime();
      });
    return collapseSnapToDaily(rows);
  }
}

function collapseSnapToDaily(rows: any[]): DayRow[] {
  const bucket = new Map<string, string[]>();
  rows.forEach((row: any) => {
    const t = row?.[SOURCE_TIME_FIELD];
    const dt: Date =
      t?.toDate?.() ? t.toDate() :
      (t instanceof Date ? t : new Date(t ?? 0));
    const key = toDayKeyTZ(dt);
    const mood = norm(row?.mood ?? '');
    if (!bucket.has(key)) bucket.set(key, []);
    bucket.get(key)!.push(mood);
  });

  // produce exactly last 5 days (fill missing with neutral)
  const today0 = startOfDayTZ(new Date());
  const keys: string[] = [];
  for (let i = 5 - 1; i >= 0; i--) {
    const d = addDaysUTC(today0, -i);
    keys.push(toDayKeyTZ(d));
  }

  const out: DayRow[] = keys.map((k, idx) => {
    const dateUTC = addDaysUTC(startOfDayTZ(new Date()), -(5 - 1 - idx));
    const raw = bucket.get(k) ?? [];
    // majority per-day; tie -> neutral
    const realList = raw.map(toRealMood);
    const counts: Partial<Record<RealMood, number>> = {};
    for (const m of realList) counts[m] = (counts[m] ?? 0) + 1;
    const pairs = Object.entries(counts as Record<string, number>).sort((a, b) => b[1] - a[1]);
    let winner: RealMood = 'neutral';
    if (pairs.length === 0) {
      winner = 'neutral';
    } else if (pairs.length === 1 || pairs[0][1] > (pairs[1]?.[1] ?? 0)) {
      winner = pairs[0][0] as RealMood;
    } else {
      winner = 'neutral';
    }
    return { key: k, date: dateUTC, mood: winner };
  });

  return out;
}

//  UI Helpers  
function moodEmoji(m: RealMood) {
  const map: Record<RealMood, string> = {
    happy: '😊', sad: '😢', angry: '😡', tired: '🥱', sick: '🤒',
    neutral: '😐', calm: '😊', excited: '😊', anxious: '😢',
  };
  return map[m] ?? '😐';
}
function moodColor(m: RealMood) {
  switch (m) {
    case 'happy':   return '#22c55e';
    case 'sad':     return '#3b82f6';
    case 'angry':   return '#ef4444';
    case 'tired':   return '#a855f7';
    case 'sick':    return '#f59e0b';
    case 'neutral': return '#94a3b8';
    default:        return '#00E0FF';
  }
}
function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
function fmtDayNice(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

// Screen  
export default function AutoPredictor() {
  const router = useRouter();
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [days, setDays] = useState<DayRow[]>([]);

  const prediction = useMemo(() => {
    if (days.length !== 5) return null;
    const last5 = days.map(d => d.mood); 
    return predictFromRules(last5);
  }, [days]);

  const load = async () => {
    setBusy(true); setErr(null);
    try {
      const d5 = await loadLast5DailyMoods();
      setDays(d5);
    } catch (e: any) {
      setErr(e?.message ?? 'Failed to load');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <LinearGradient colors={['#0d0b2f', '#2a1faa']} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/mood_trends')} style={{ paddingVertical: 8 }}>
          <Text style={{ color: '#fff', fontSize: 30, paddingTop: 5, paddingRight: 5 }}>←</Text>
        </TouchableOpacity>

        <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 6 }}>
          Last 5 Days → Predict Day 6
        </Text>

        <View style={{ height: 10 }} />

        <TouchableOpacity
          onPress={load}
          disabled={busy}
          style={{
            alignSelf: 'flex-start',
            backgroundColor: '#00e0ff',
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 10,
            opacity: busy ? 0.6 : 1
          }}
        >
          {busy ? <ActivityIndicator color="#00121a" /> :
            <Text style={{ color: '#00121a', fontWeight: '400' }}>Refresh</Text>}
        </TouchableOpacity>

        <View style={{ height: 16 }} />
        <View style={{ gap: 10 }}>
          {busy ? (
            <View style={{ padding: 16, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10 }}>
              <ActivityIndicator color="#fff" />
            </View>
          ) : err ? (
            <View style={{ padding: 16, backgroundColor: 'rgba(255,64,64,0.18)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,64,64,0.35)' }}>
              <Text style={{ color: '#ffd3d3' }}>{err}</Text>
            </View>
          ) : (
            <>
              {days.map((d, idx) => (
                <View
                  key={d.key}
                  style={{
                    padding: 14,
                    borderRadius: 12,
                    backgroundColor: 'rgba(0,224,255,0.10)',
                    borderWidth: 1,
                    borderColor: 'rgba(0,224,255,0.28)'
                  }}
                >
                  <Text style={{ color: '#cfe8ff', fontWeight: '700' }}>
                    Day {idx + 1} • {fmtDayNice(d.date)}
                  </Text>
                  <Text style={{ color: '#eaffff', marginTop: 4, fontSize: 16 }}>
                    {moodEmoji(d.mood)} {d.mood}
                  </Text>
                </View>
              ))}
            </>
          )}
        </View>

        <View style={{ height: 16 }} />

        <View
          style={{
            padding: 16,
            borderRadius: 12,
            backgroundColor: 'rgba(0,224,255,0.12)',
            borderWidth: 1,
            borderColor: 'rgba(0,224,255,0.35)'
          }}
        >
          {busy ? (
            <Text style={{ color: '#fff' }}>Predicting…</Text>
          ) : prediction ? (
            <>
              <View style={{ alignItems: 'center', marginBottom: 10 }}>
                <RingProgress
                  radius={80}
                  strokeWidth={20}
                  progress={prediction.pct}                       // 0..1
                  color={moodColor(prediction.moodReal)}
                  backgroundColor="rgba(255,255,255,0.15)"
                  center={
                    <Text style={{ fontSize: 48 }}>
                      {moodEmoji(prediction.moodReal)}
                    </Text>
                  }
                />
                <Text style={{ color: '#eaffff', fontSize: 18, fontWeight: '800', marginTop: 8 }}>
                  {cap(prediction.moodReal)} • {(prediction.pct * 100).toFixed(0)}%
                </Text>
              </View>
            </>
          ) : (
            <Text style={{ color: '#fff' }}>
              Not enough data. Add moods for the last 5 days.
            </Text>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}
