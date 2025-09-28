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

/** ===== Config ===== */
const TZ = 'Asia/Colombo';
const SOURCE_COLLECTION = 'MoodHistory';
const SOURCE_TIME_FIELD = 'createdAt';

/** ===== Types ===== */
type RealMood = 'happy' | 'sad' | 'angry' | 'tired' | 'sick' | 'neutral' | 'calm' | 'excited' | 'anxious';
type Rule = { pred: string; pct: number; reason: string };
type RuleMap = Record<string, Rule>;

/** ===== Load Excel-compiled rules =====
 * Use require to avoid needing "resolveJsonModule" in tsconfig.
 */
const RULES: RuleMap = require('../../data/mood_rules.json');

/** ===== Mappings (same as your manual predictor) ===== */
const CHOICES: { key: RealMood; label: string; emoji: string }[] = [
  { key: 'happy',  label: 'Happy',  emoji: '😊' },
  { key: 'sad',    label: 'Sad',    emoji: '😢' },
  { key: 'angry',  label: 'Angry',  emoji: '😡' },
  { key: 'tired',  label: 'Tired',  emoji: '🥱' },
  { key: 'sick',   label: 'Sick',   emoji: '🤒' },
  { key: 'neutral',label: 'Neutral',emoji: '😐' },
];

const EMOJI_TO_REAL: Record<string, RealMood> = {
  '😊':'happy','😐':'neutral','😢':'sad','😡':'angry','🥱':'tired','🤒':'sick'
};

const REAL_TO_MOODN: Record<string, string> = {
  happy:'Mood 1', calm:'Mood 1', excited:'Mood 1',
  sad:'Mood 2', neutral:'Mood 2', anxious:'Mood 2', sorrow:'Mood 2',
  angry:'Mood 3',
  tired:'Mood 4',
  sick:'Mood 5',
};

const MOODN_TO_REAL: Record<string, RealMood> = {
  'Mood 1':'happy', 'Mood 2':'sad', 'Mood 3':'angry', 'Mood 4':'tired', 'Mood 5':'sick',
};

/** ===== Time helpers (TZ safe) ===== */
function toDayKeyTZ(d: Date, tz = TZ) {
  // YYYY-MM-DD in the given timezone (no UTC shift)
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year:'numeric', month:'2-digit', day:'2-digit' });
  return fmt.format(d); // e.g. 2025-09-28
}
function startOfDayTZ(d: Date, tz = TZ) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year:'numeric', month:'2-digit', day:'2-digit' })
    .formatToParts(d).reduce((a,p)=> (a[p.type]=p.value, a), {} as any);
  return new Date(Date.UTC(+parts.year, +parts.month-1, +parts.day, 0,0,0));
}
function addDaysUTC(d: Date, n: number) { const x = new Date(d.getTime()); x.setUTCDate(x.getUTCDate()+n); return x; }

/** ===== Normalization ===== */
const norm  = (s: any) => String(s || '').trim();
const lower = (s: any) => norm(s).toLowerCase();

function toRealMood(input: any): RealMood {
  if (!input) return 'neutral';
  const raw = norm(input);
  if (EMOJI_TO_REAL[raw]) return EMOJI_TO_REAL[raw];
  const k = lower(raw);
  // map common labels you have in data
  if (k === 'happy' || k === 'joy' || k === 'good') return 'happy';
  if (k === 'neutral' || k === 'ok') return 'neutral';
  if (k === 'sad' || k === 'down' || k === 'sorrow') return 'sad';
  if (k === 'angry' || k === 'mad') return 'angry';
  if (k === 'tired' || k === 'sleepy') return 'tired';
  if (k === 'sick' || k === 'ill') return 'sick';
  // fallback
  return 'neutral';
}

function toMoodN(input: string) {
  const raw = norm(input);
  const m = /^mood\s*([1-5])$/i.exec(raw);
  if (m) return `Mood ${m[1]}`;
  return REAL_TO_MOODN[lower(input)] || 'Mood 2'; // default Mood 2 = "sad" bucket like your table
}

const key5  = (a: string[]) => a.join('|');

function allEqual(arr: string[]) { return arr.length > 0 && arr.every((x) => x === arr[0]); }

function majority(list: string[]) {
  const c: Record<string, number> = {};
  list.forEach((m) => (c[m] = (c[m] || 0) + 1));
  const pairs = Object.entries(c).sort((a, b) => b[1] - a[1]);
  if (!pairs.length) return { mood: 'Mood 2', tie: false, count: 0 };
  const [topM, topC] = pairs[0];
  const second = pairs[1]?.[1] ?? 0;
  return { mood: topM, tie: topC === second, count: topC };
}

const detectAlternate = (a: string[]) => {
  const [d1, d2, d3, d4, d5] = a;
  return d1 === d3 && d3 === d5 && d2 === d4 && d1 !== d2 ? d1 : null;
};

function fallbackPredict(last5N: string[]): Rule {
  const [d1, d2, d3, d4, d5] = last5N;

  if (allEqual(last5N)) return { pred: d5, pct: 1.0, reason: 'All past days same mood' };
  if (d3 === d4 && d4 === d5) return { pred: d5, pct: 1.0, reason: 'Last 3 days same mood' };
  if (d1 === d2 && d2 === d3 && d4 === d5 && d3 !== d4)
    return { pred: d5, pct: 0.9, reason: 'Last 2 days repeating' };
  if (d4 === d5) return { pred: d5, pct: 0.8, reason: 'Last 2 days same mood' };

  const alt = detectAlternate(last5N);
  if (alt) return { pred: alt, pct: 0.7, reason: 'Alternate pattern' };
  if (d1 === d5) return { pred: d5, pct: 0.8, reason: 'Start & end same mood' };
  if (d2 === d4) {
    const cnt = last5N.filter((x) => x === d2).length;
    return { pred: d2, pct: cnt >= 3 ? 0.65 : 0.6, reason: 'Every-other day pattern' };
  }

  const maj = majority(last5N);
  if (!maj.tie && maj.count >= 3) return { pred: maj.mood, pct: 0.75, reason: 'Majority in last 5' };
  if (!maj.tie) return { pred: maj.mood, pct: 0.66, reason: 'Majority in last 5' };

  return { pred: d5, pct: 0.6, reason: 'Mixed pattern; momentum from yesterday' };
}

function predictFromRules(last5Real: RealMood[]) {
  const last5N = last5Real.map((m) => toMoodN(m));
  const exact = RULES[key5(last5N)];
  if (exact) {
    return {
      moodReal: (MOODN_TO_REAL[exact.pred] || (exact.pred as RealMood)),
      pct: exact.pct,
      reason: exact.reason + ' (from Excel)',
    };
  }
  const fb = fallbackPredict(last5N);
  return {
    moodReal: (MOODN_TO_REAL[fb.pred] || (fb.pred as RealMood)),
    pct: fb.pct,
    reason: fb.reason + ' (fallback)',
  };
}

/** ===== Fetch & collapse to daily moods ===== */
type DayRow = { key: string; date: Date; mood: RealMood };

async function loadLast5DailyMoods(): Promise<DayRow[]> {
  const today0 = startOfDayTZ(new Date());
  const start = addDaysUTC(today0, -(5 - 1));  // oldest day (Day 1)
  const end   = addDaysUTC(today0, 1);         // tomorrow 00:00

  // Primary: range + orderBy (needs composite index in some cases)
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
    // Fallback: full scan then filter + sort locally
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
  // bucket all source rows by TZ local day
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

  // ensure we produce 5 days (fill missing with neutral)
  const today0 = startOfDayTZ(new Date());
  const keys: string[] = [];
  for (let i = 5 - 1; i >= 0; i--) {
    const d = addDaysUTC(today0, -i);
    keys.push(toDayKeyTZ(d));
  }

  const out: DayRow[] = keys.map((k, idx) => {
    const dateUTC = addDaysUTC(startOfDayTZ(new Date()), -(5 - 1 - idx));
    const raw = bucket.get(k) ?? [];
    // majority for the day; tie -> neutral
    const realList = raw.map(toRealMood);
    const counts: Record<RealMood, number> = { happy:0,sad:0,angry:0,tired:0,sick:0,neutral:0,calm:0,excited:0,anxious:0 };
    for (const m of realList) counts[m] = (counts[m] ?? 0) + 1;
    const pairs = Object.entries(counts).filter(([_,c]) => c>0).sort((a,b)=> (b[1]-a[1]));
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

/** ===== UI Helpers ===== */
function moodEmoji(m: RealMood) {
  return CHOICES.find(c => c.key === m)?.emoji ?? '';
}
function fmtDayNice(d: Date) {
  return d.toLocaleDateString(undefined, { weekday:'short', month:'short', day:'numeric' });
}

/** ===== Screen ===== */
export default function AutoPredictor() {
  const router = useRouter();
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [days, setDays] = useState<DayRow[]>([]);

  const prediction = useMemo(() => {
    if (days.length !== 5) return null;
    const last5 = days.map(d => d.mood); // Day1..Day5 oldest→latest
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
    <LinearGradient colors={['#0d0b2f', '#2a1faa']} style={{ flex:1 }}>
      <ScrollView contentContainerStyle={{ padding:16, paddingBottom: 40 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ paddingVertical:8 }}>
          <Text style={{ color:'#fff', fontSize:18 }}>← Back</Text>
        </TouchableOpacity>

        <Text style={{ color:'#fff', fontSize:24, fontWeight:'800', marginTop:6 }}>
          Last 5 Days → Predict Day 6
        </Text>
        <Text style={{ color:'#b9c7ff', marginTop:6 }}>
          Auto-fetched from Firestore ({SOURCE_COLLECTION}) using {SOURCE_TIME_FIELD} in {TZ}.
        </Text>

        <View style={{ height:12 }} />

        <TouchableOpacity
          onPress={load}
          disabled={busy}
          style={{
            alignSelf:'flex-start',
            backgroundColor:'#00e0ff',
            paddingHorizontal:16,
            paddingVertical:10,
            borderRadius:10,
            opacity: busy ? 0.6 : 1
          }}
        >
          {busy ? <ActivityIndicator color="#00121a" /> :
            <Text style={{ color:'#00121a', fontWeight:'800' }}>Refresh</Text>}
        </TouchableOpacity>

        <View style={{ height:16 }} />

        {/* Last 5 days list */}
        <View style={{ gap:10 }}>
          {busy ? (
            <View style={{ padding:16, backgroundColor:'rgba(255,255,255,0.06)', borderRadius:10 }}>
              <ActivityIndicator color="#fff" />
            </View>
          ) : err ? (
            <View style={{ padding:16, backgroundColor:'rgba(255,64,64,0.18)', borderRadius:10, borderWidth:1, borderColor:'rgba(255,64,64,0.35)' }}>
              <Text style={{ color:'#ffd3d3' }}>{err}</Text>
            </View>
          ) : (
            <>
              {days.map((d, idx) => (
                <View
                  key={d.key}
                  style={{
                    padding:14,
                    borderRadius:12,
                    backgroundColor:'rgba(0,224,255,0.10)',
                    borderWidth:1,
                    borderColor:'rgba(0,224,255,0.28)'
                  }}
                >
                  <Text style={{ color:'#cfe8ff', fontWeight:'700' }}>
                    Day {idx+1} • {fmtDayNice(d.date)}
                  </Text>
                  <Text style={{ color:'#eaffff', marginTop:4, fontSize:16 }}>
                    {moodEmoji(d.mood)} {d.mood}
                  </Text>
                </View>
              ))}
            </>
          )}
        </View>

        <View style={{ height:16 }} />

        {/* Prediction card */}
        <View
          style={{
            padding:16,
            borderRadius:12,
            backgroundColor:'rgba(0,224,255,0.12)',
            borderWidth:1,
            borderColor:'rgba(0,224,255,0.35)'
          }}
        >
          {busy ? (
            <Text style={{ color:'#fff' }}>Predicting…</Text>
          ) : prediction ? (
            <>
              <Text style={{ color:'#eaffff', fontSize:18, fontWeight:'800' }}>
                Day 6 prediction — {moodEmoji(prediction.moodReal)} {prediction.moodReal} {(prediction.pct * 100).toFixed(0)}%
              </Text>
              <Text style={{ color:'#cfe8ff', marginTop:6 }}>
                Reason: {prediction.reason}
              </Text>
            </>
          ) : (
            <Text style={{ color:'#fff' }}>
              Not enough data. Add moods for the last 5 days.
            </Text>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}
