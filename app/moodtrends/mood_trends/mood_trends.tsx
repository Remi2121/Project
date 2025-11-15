// app/moodtrends/index.tsx
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
import { LineChart as RNLineChart } from 'react-native-gifted-charts';

import { auth, db } from 'utils/firebaseConfig';
import { useSettings } from '../../utilis/Settings';
import { getMoodTrendsStyles } from './mood_trends_styles';

// TS quirk workaround:
const LineChartAny = RNLineChart as unknown as React.ComponentType<any>;

type MoodKey = string;

interface MoodEntry {
  id: string;
  mood: MoodKey;
  text?: string;
  time: Date; // normalized Date
}

interface WeekBucket {
  start: Date;
  dayMood: (MoodKey | null)[];
  dominantMood: MoodKey | null;
  dominantCount: number;
  percentage: number;
}

const WEEKS_COUNT = 5;

const EMOJI_NAME: Record<string, string> = {
  '😊': 'Happy', '😐': 'Neutral', '😢': 'Sad', '😡': 'Angry', '🥱': 'Tired', '🤒': 'Sick',
};
const NAME_EMOJI: Record<string, string> = {
  happy: '😊', joy: '😊', good: '😊',
  neutral: '😐', ok: '😐', okay: '😐',
  sad: '😢', down: '😢', sorrow: '😢',
  angry: '😡', mad: '😡', anger: '😡',
  tired: '🥱', sleepy: '🥱',
  sick: '🤒', ill: '🤒',
};

const normalizeMood = (m: any): { name: string; emoji: string } => {
  if (!m) return { name: '—', emoji: '' };
  const raw = String(m).trim();
  if (EMOJI_NAME[raw]) return { name: EMOJI_NAME[raw], emoji: raw };
  const key = raw.toLowerCase();
  const emoji = NAME_EMOJI[key] ?? '';
  const name  = key ? key.charAt(0).toUpperCase() + key.slice(1) : '—';
  return { name, emoji };
};

const moodEmoji = (m: MoodKey | null): string => (m ? normalizeMood(m).emoji : '');

const startOfWeekSun = (d: Date) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  date.setDate(date.getDate() - day);
  return date;
};
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const toDate = (val: any): Date => {
  if (!val) return new Date(0);
  if (val instanceof Date) return val;
  if (val?.toDate && typeof val.toDate === 'function') return val.toDate();
  if (typeof val?.seconds === 'number') return new Date(val.seconds * 1000);
  if (typeof val === 'object' && val.date && val.time) return new Date(`${val.date} ${val.time}`);
  const d = new Date(val);
  return isNaN(d.getTime()) ? new Date(0) : d;
};

async function loadLastNWeeksMoodOnly(uid: string, weeksCount: number): Promise<MoodEntry[]> {
  const earliestWeekStart = addDays(startOfWeekSun(new Date()), -(weeksCount - 1) * 7);
  const coll = collection(db, 'users', uid, 'MoodHistory');

  try {
    const qMH = query(
      coll,
      where('createdAt', '>=', Timestamp.fromDate(earliestWeekStart)),
      orderBy('createdAt', 'asc')
    );
    const snap = await getDocs(qMH);
    if (!snap.empty) {
      return snap.docs.map(d => {
        const docData: any = d.data();
        const when = docData.createdAt ?? docData.timestamp ?? { date: docData.date, time: docData.time };
        return { id: d.id, mood: docData.mood as MoodKey, text: docData.text ?? '', time: toDate(when) };
      }).filter(r => !isNaN(r.time.getTime()));
    }
  } catch {/* ignore */}
  const snapAll = await getDocs(coll);
  return snapAll.docs
    .map(d => {
      const docData: any = d.data();
      const when = docData.createdAt ?? docData.timestamp ?? { date: docData.date, time: docData.time };
      return { id: d.id, mood: docData.mood as MoodKey, text: docData.text ?? '', time: toDate(when) };
    })
    .filter(r => !isNaN(r.time.getTime()) && r.time >= earliestWeekStart)
    .sort((a, b) => a.time.getTime() - b.time.getTime());
}

export default function MoodTrendsComponent() {
  const router = useRouter();
  const { isDark } = useSettings();
  const styles = getMoodTrendsStyles(isDark);

  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (!u) {
        router.replace('/authpages/Login-page');
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const rows = await loadLastNWeeksMoodOnly(u.uid, WEEKS_COUNT);
        setEntries(rows);
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load data');
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, [router]);

  const weeks = useMemo(() => {
    const current = startOfWeekSun(new Date());
    const starts: Date[] = [];
    for (let i = WEEKS_COUNT - 1; i >= 0; i--) starts.push(addDays(current, -i * 7));

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

    const chooseDayMood = (items: MoodEntry[]): MoodKey | null => {
      if (items.length === 0) return null;
      const counts = new Map<string, number>();
      items.forEach((it) => {
        const nm = normalizeMood(it.mood);
        const key = nm.emoji || nm.name;
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
      (week as any)._raw = (week as any)._raw ?? new Map<number, MoodEntry[]>();
      const dayIdx = entry.time.getDay();
      const arr = (week as any)._raw.get(dayIdx) ?? [];
      arr.push(entry);
      (week as any)._raw.set(dayIdx, arr);
    }

    bucketMap.forEach((week) => {
      const raw: Map<number, MoodEntry[]> = (week as any)._raw ?? new Map<number, MoodEntry[]>();

      for (let d = 0; d < 7; d++) {
        week.dayMood[d] = chooseDayMood(raw.get(d) ?? []);
      }

      const counts = new Map<string, number>();
      week.dayMood.forEach((mk) => { if (mk) counts.set(mk, (counts.get(mk) ?? 0) + 1); });
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

  const chartData = useMemo(() => {
    return weeks.map((w, idx) => {
      const e = w.dominantMood ? (EMOJI_NAME[w.dominantMood] ? w.dominantMood : moodEmoji(w.dominantMood)) : '';
      return {
        value: w.percentage,
        label: `Week ${idx + 1}`,
        customDataPoint: (_i: number, p: any) => (
          <View style={{ position: 'absolute', top: p.y - 35, left: p.x - 10, alignItems: 'center' }}>
            <Text style={{ fontSize: 16, color: isDark ? '#e6e6e6' : '#2a1faa' }}>{e}</Text>
          </View>
        ),
      };
    });
  }, [weeks, isDark]);

  const buttons = [
    { label: 'Add Entry', icon: '✏️', onPress: () => router.push({ pathname: '/(tabs)/journal' }) },
    { label: 'Statistics', icon: '📊', onPress: () => router.push({ pathname: '/moodtrends/statistics/statistics' }) },
    { label: 'History', icon: '🕒', onPress: () => router.push({ pathname: '/moodtrends/history/history' }) },
    { label: 'Predict', icon: '🔍', onPress: () => router.push({ pathname: '/moodtrends/predition/PredictorFR' }) },
  ];

  // readonly tuples for LinearGradient typing
  const GRADIENT = isDark ? (['#07070aff', '#0f0f16ff'] as const) : (['#ffffffff', '#ffffff'] as const);

  if (loading) {
    return (
      <LinearGradient colors={GRADIENT} style={styles.gradient}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={isDark ? '#9aa3ff' : '#00e0ff'} />
          <Text style={[styles.heading, { marginTop: 10, color: isDark ? '#e6e6e6' : '#2a1faa' }]}>Loading mood trends…</Text>
        </View>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={GRADIENT} style={styles.gradient}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: isDark ? '#e6e6e6' : '#2a1faa' }}>Error: {error}</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={GRADIENT} style={styles.gradient}>
      <ScrollView contentContainerStyle={[styles.scrollContainer, { paddingBottom: 140 }]} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <TouchableOpacity
            onPress={() => router.replace("/(tabs)")}
            style={styles.backButton}
            accessibilityLabel="Go to Home">
            <Text style={[styles.backIcon, { color: isDark ? '#e6e6e6' : '#2a1faa' }]}>←</Text>
          </TouchableOpacity>

          <Text style={[styles.heading, { color: isDark ? '#e6e6e6' : '#2a1faa' }]}>Mood Trends</Text>

          <View style={styles.chartContainer}>
            <LineChartAny
              data={chartData}
              thickness={3}
              color={isDark ? '#9aa3ff' : '#00e0ff'}
              curved
              hideRules
              hideAxesAndRules
              yAxisTextStyle={{ color: 'transparent' }}
              xAxisLabelTextStyle={{ color: isDark ? '#e6e6e6' : '#2a1faa', fontSize: 12 }}
              dataPointsColor={isDark ? '#9aa3ff' : '#00e0ff'}
              dataPointsRadius={4}
              spacing={60}
              maxValue={100}
            />
          </View>

          <View style={styles.moodTextContainer}>
            <Text style={[styles.moodText, { color: isDark ? '#cfcfcf' : '#2a1faa' }]}>View your mood trends and insights</Text>
          </View>

          <View style={styles.buttonRow}>
            {buttons.map((btn, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  { backgroundColor: isDark ? '#151523' : '#ffffff', borderColor: isDark ? '#6f6cff' : '#2a1faa' }
                ]}
                onPress={btn.onPress}
              >
                <View style={styles.buttonContent}>
                  <Text style={[styles.emojiText, { color: isDark ? '#e6e6e6' : '#000' }]}>{btn.icon}</Text>
                  <Text style={[styles.buttonText, { color: isDark ? '#e6e6e6' : '#2a1faa' }]}>{btn.label}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}
