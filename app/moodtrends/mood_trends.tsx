import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

// 🔥 Firestore
import { collection, getDocs, orderBy, query, Timestamp, where } from 'firebase/firestore';
import { db } from 'utils/firebaseConfig';

// 🎨 Styles
import styles from './mood_trends_styles';

type MoodKey = string;

interface JournalEntry {
  id: string;
  mood: MoodKey;
  text?: string;
  time: Date; // Firestore createdAt -> JS Date
}

interface WeekBucket {
  start: Date;                 // Sunday 00:00
  dayMood: (MoodKey | null)[]; // [Sun..Sat]
  dominantMood: MoodKey | null;
  dominantCount: number;       // 0..7
  percentage: number;          // (dominantCount/7)*100
}

/** ===== Config ===== */
const WEEKS_COUNT = 5; // change to 7 if you want 7 weeks on X-axis
const FIRESTORE_COLLECTION = 'MoodHistory';
const FIRESTORE_TIME_FIELD = 'createdAt';

// ---- Helpers ----
const EMOJI_NAME: Record<string, string> = {
  '😊': 'Happy', '😐': 'Neutral', '😢': 'Sad', '😡': 'Angry', '🥱': 'Tired', '🤒': 'Sick',
};
const NAME_EMOJI: Record<string, string> = {
  'happy': '😊', 'joy': '😊', 'good': '😊',
  'neutral': '😐', 'ok': '😐',
  'sad': '😢', 'down': '😢',
  'angry': '😡', 'mad': '😡',
  'tired': '🥱', 'sleepy': '🥱',
  'sick': '🤒', 'ill': '🤒',
};

const normalizeMood = (m: any): { name: string; emoji: string } => {
  if (!m) return { name: '—', emoji: '' };
  const raw = String(m).trim();
  if (EMOJI_NAME[raw]) return { name: EMOJI_NAME[raw], emoji: raw }; // emoji input
  const key = raw.toLowerCase();
  const emoji = NAME_EMOJI[key] ?? '';
  const name  = key ? key.charAt(0).toUpperCase() + key.slice(1) : '—';
  return { name, emoji };
};

const moodName  = (m: MoodKey | null): string => (m ? normalizeMood(m).name : '—');
const moodEmoji = (m: MoodKey | null): string => (m ? normalizeMood(m).emoji : '');

const startOfWeekSun = (d: Date) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay(); // 0=Sun
  date.setDate(date.getDate() - day);
  return date;
};
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const toDate = (val: any): Date => {
  if (!val) return new Date(0);
  if (val instanceof Date) return val;
  if (val?.toDate && typeof val.toDate === 'function') return val.toDate();
  const d = new Date(val);
  return isNaN(d.getTime()) ? new Date(0) : d;
};
const fmtRangeShort = (start: Date) => {
  const end = addDays(start, 6);
  const s = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const e = end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${s}–${e}`;
};
const fmtDayLong = (d: Date) =>
  d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

// ✅ Local timezone YYYY-MM-DD (no UTC shift)
const formatLocalYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export default function MoodTrendsComponent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 🚀 Load last N weeks entries from Firestore (using createdAt)
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const now = new Date();
        const currentWeekStart = startOfWeekSun(now);
        const earliestWeekStart = addDays(currentWeekStart, -(WEEKS_COUNT - 1) * 7);

        const q = query(
          collection(db, FIRESTORE_COLLECTION),
          where(FIRESTORE_TIME_FIELD, '>=', Timestamp.fromDate(earliestWeekStart)),
          orderBy(FIRESTORE_TIME_FIELD, 'asc')
        );

        const snap = await getDocs(q);

        const rows: JournalEntry[] = snap.docs.map((doc) => {
          const data: any = doc.data();
          const t = toDate(data[FIRESTORE_TIME_FIELD]);
          const m = data.mood as MoodKey;
          return { id: doc.id, mood: m, text: data.text ?? '', time: t };
        });

        setEntries(rows);
      } catch (e: any) {
        // Fallback: no composite index
        try {
          console.warn('Primary query failed; retrying without where/orderBy:', e?.message);
          const snap = await getDocs(collection(db, FIRESTORE_COLLECTION));
          const now = new Date();
          const earliestWeekStart = addDays(startOfWeekSun(now), -(WEEKS_COUNT - 1) * 7);

          const rows: JournalEntry[] = snap.docs
            .map((doc) => {
              const data: any = doc.data();
              const t = toDate(data[FIRESTORE_TIME_FIELD]);
              const m = data.mood as MoodKey;
              return { id: doc.id, mood: m, text: data.text ?? '', time: t };
            })
            .filter((r) => r.time >= earliestWeekStart)
            .sort((a, b) => a.time.getTime() - b.time.getTime());

          setEntries(rows);
        } catch (err: any) {
          setError(err?.message ?? 'Failed to load data');
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // 🧮 Build week buckets (oldest → newest)
  const weeks: WeekBucket[] = useMemo(() => {
    const now = new Date();
    const current = startOfWeekSun(now);
    const starts: Date[] = [];
    for (let i = WEEKS_COUNT - 1; i >= 0; i--) {
      starts.push(addDays(current, -i * 7));
    }

    const bucketMap = new Map<string, WeekBucket>();
    starts.forEach((s) => {
      bucketMap.set(s.toISOString(), {
        start: s,
        dayMood: Array(7).fill(null),
        dominantMood: null,
        dominantCount: 0,
        percentage: 0,
      });
    });

    const chooseDayMood = (items: JournalEntry[]): MoodKey | null => {
      if (items.length === 0) return null;
      const counts = new Map<string, number>();
      items.forEach((it) => {
        const norm = normalizeMood(it.mood);
        const key = norm.emoji || norm.name; // prefer emoji key; else name
        counts.set(key, (counts.get(key) ?? 0) + 1);
      });
      let best: string | null = null, bestCount = -1;
      counts.forEach((c, k) => { if (c > bestCount) { bestCount = c; best = k; } });
      return best ?? null;
    };

    for (const entry of entries) {
      const wStart = startOfWeekSun(entry.time);
      const key = wStart.toISOString();
      if (!bucketMap.has(key)) continue;
      const week = bucketMap.get(key)!;
      (week as any)._raw = (week as any)._raw ?? new Map<number, JournalEntry[]>();
      const dayIdx = entry.time.getDay(); // 0..6
      const arr = (week as any)._raw.get(dayIdx) ?? [];
      arr.push(entry);
      (week as any)._raw.set(dayIdx, arr);
    }

    bucketMap.forEach((week) => {
      const raw: Map<number, JournalEntry[]> = (week as any)._raw ?? new Map<number, JournalEntry[]>();

      for (let d = 0; d < 7; d++) {
        const moodKey = chooseDayMood(raw.get(d) ?? []);
        week.dayMood[d] = moodKey;
      }

      const counts = new Map<string, number>();
      for (const mk of week.dayMood) {
        if (!mk) continue;
        counts.set(mk, (counts.get(mk) ?? 0) + 1);
      }
      if (counts.size === 0) {
        week.dominantMood = null;
        week.dominantCount = 0;
        week.percentage = 0;
      } else {
        let best: string | null = null, bestCount = -1;
        counts.forEach((c, k) => { if (c > bestCount) { bestCount = c; best = k; } });
        week.dominantMood = best;
        week.dominantCount = bestCount;
        week.percentage = Math.round((bestCount / 7) * 100);
      }
      delete (week as any)._raw;
    });

    return starts.map((s) => bucketMap.get(s.toISOString())!);
  }, [entries]);

  // 📣 Console logs (oldest = week 1) — uses local YYYY-MM-DD
  const loggedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!weeks || weeks.length === 0) return;
    const sig = weeks.map((w) => w.start.toISOString() + (w.dominantMood ?? '') + w.percentage).join('|');
    if (loggedRef.current === sig) return;
    loggedRef.current = sig;

    weeks.forEach((w, idx) => {
      const weekNo = idx + 1;
      console.log(`week ${weekNo} - ${fmtRangeShort(w.start)}`);
      for (let dIdx = 0; dIdx < 7; dIdx++) {
        const dayDate = addDays(w.start, dIdx);
        const localYMD = formatLocalYMD(dayDate);
        const mKey = w.dayMood[dIdx];
        const name = moodName(mKey);
        const sticker = mKey ? (EMOJI_NAME[mKey] ? mKey : moodEmoji(mKey)) : '';
        console.log(`week ${weekNo} - ${localYMD} , ${name}${sticker ? ' ' + sticker : ''}`);
      }
      const finalName = moodName(w.dominantMood);
      const finalSticker = w.dominantMood ? (EMOJI_NAME[w.dominantMood] ? w.dominantMood : moodEmoji(w.dominantMood)) : '';
      console.log(`week ${weekNo} - final mood ${finalName}${finalSticker ? ' ' + finalSticker : ''} , ${w.percentage}%`);
    });
  }, [weeks]);

  // 📈 Weekly chart — X-axis labels as "Week 1", "Week 2", ...
  const chartData = useMemo(() => {
    return weeks.map((w, idx) => {
      const e = w.dominantMood ? (EMOJI_NAME[w.dominantMood] ? w.dominantMood : moodEmoji(w.dominantMood)) : '';
      return {
        value: w.percentage,
        label: `Week ${idx + 1}`,
        customDataPoint: (_i: number, p: any) => (
          <View style={{ position: 'absolute', top: p.y - 35, left: p.x - 10, alignItems: 'center' }}>
            <Text style={{ fontSize: 16 }}>{e}</Text>
          </View>
        ),
      };
    });
  }, [weeks]);

  const buttons = [
    { label: 'Add Entry', icon: '✏️', onPress: () => router.push({ pathname: '/(tabs)/journal' }) },
    { label: 'Statistics', icon: '📊', onPress: () => router.push({ pathname: '../../journal/journal' }) },
    { label: 'History', icon: '🕒', onPress: () => router.push({ pathname: '/moodtrends/history' }) },
    { label: 'Predict', icon: '🔍', onPress: () => router.push({ pathname: '../../journal/journal' }) },
  ];

  if (loading) {
    return (
      <LinearGradient colors={['#0d0b2f', '#2a1faa']} style={styles.gradient}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#00e0ff" />
          <Text style={{ color: 'white', marginTop: 10 }}>Loading mood trends…</Text>
        </View>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={['#0d0b2f', '#2a1faa']} style={styles.gradient}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: 'white' }}>Error: {error}</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0d0b2f', '#2a1faa']} style={styles.gradient}>
      <View style={styles.container}>
        <Text style={styles.heading}>Mood Trends</Text>

        <View style={styles.chartContainer}>
          <LineChart
            data={chartData}
            thickness={3}
            color="#00e0ff"
            curved
            hideRules
            hideAxesAndRules
            yAxisTextStyle={{ color: 'transparent' }}
            xAxisLabelTextStyle={{ color: 'white', fontSize: 12 }}
            dataPointsColor="#00e0ff"
            dataPointsRadius={4}
            spacing={60}   // tweak this if you want different gap
            maxValue={100}
          />
        </View>

        <View style={styles.moodTextContainer}>
          <Text style={styles.moodText}>View your mood trends and insights</Text>
        </View>

        <FlatList
          data={weeks}
          keyExtractor={(w) => w.start.toISOString()}
          contentContainerStyle={{ paddingTop: 10 }}
          renderItem={({ item, index }) => (
            <View style={styles.weekCard}>
              <Text style={styles.weekTitle}>
                Wk {index + 1} • {fmtRangeShort(item.start)}
              </Text>
              <Text style={styles.weekLine}>
                Dominant{' '}
                <Text style={styles.weekBold}>
                  {moodName(item.dominantMood)} {moodEmoji(item.dominantMood)}
                </Text>{' '}
                • <Text style={styles.weekBold}>{item.percentage}%</Text>
              </Text>

              {/* Daily lines: Date — MoodName Sticker */}
              <View style={{ marginTop: 8 }}>
                {Array.from({ length: 7 }).map((_, dIdx) => {
                  const dayDate = addDays(item.start, dIdx);
                  const mk = item.dayMood[dIdx];
                  return (
                    <Text key={dIdx} style={styles.weekLineSmall}>
                      {fmtDayLong(dayDate)} — {moodName(mk)} {moodEmoji(mk)}
                    </Text>
                  );
                })}
              </View>
            </View>
          )}
        />

        <View style={styles.buttonRow}>
          {buttons.map((btn, index) => (
            <TouchableOpacity key={index} style={styles.button} onPress={btn.onPress}>
              <View style={styles.buttonContent}>
                <Text style={styles.emojiText}>{btn.icon}</Text>
                <Text style={styles.buttonText}>{btn.label}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </LinearGradient>
  );
}
