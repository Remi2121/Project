
import React from 'react';
import { TouchableOpacity, StyleSheet, Text, View, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';


export default function Recommendation() {
    const { mood } = useLocalSearchParams();
    const router = useRouter();


    return (
        <LinearGradient colors={['#0d0b2f', '#2a1faa']} style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.header}>You Seem {typeof mood === 'string' ? mood : '...'}...</Text>
            <Text style={{ color: '#ffffff', fontSize: 16, textAlign: 'center', marginBottom: 20,}}>
                Here are some suggestions to help you feel better.
            </Text>
            <Text style={{ color: '#ffffff', fontSize: 16, textAlign: 'center', marginBottom: 20,}}>
                Tap on any tile to explore more.
            </Text>
            <View style={styles.grid}>

                <TouchableOpacity style={styles.tile} onPress={() => router.push({pathname: '/(tabs)/explore',params: { mood }}) }>
                    <Ionicons name="play-circle" style={{fontSize: 70, color: '#fff'}} />
                    <Text style={styles.tileText}>Play Music</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.tile} onPress={() => router.push('/explore')}>
                    <Text style={styles.icon}>🧘</Text>
                    <Text style={styles.tileText}> Take Meditation</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.tile} onPress={() => router.push('/journal/journal')}>
                    <Text style={styles.icon}>📘</Text>
                    <Text style={styles.tileText}>Add to Journal</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.tile} onPress={() => router.push('/moodtrends')}>
                    <Text style={styles.icon}>📊</Text>
                    <Text style={styles.tileText}>Check Mood Trends</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.tile} onPress={() => router.push({ pathname: '/(tabs)/chatbot', params: { topic: mood } })}>
                    <Text style={styles.icon}>💬</Text>
                    <Text style={styles.tileText}>Talk to Chatbot</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.tile} onPress={() => router.push('/journal')}>
                    <Ionicons name="calendar-outline" style={{fontSize: 70, color: '#fff'}} />
                    <Text style={styles.tileText}>Mood Calendar</Text>
                </TouchableOpacity>

            </View>
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 80,
        paddingHorizontal: 24,
        backgroundColor: '#0d0b2f',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    tile: {
        backgroundColor: '#1f1b5a',
        width: '48%',
        padding: 20,
        borderRadius: 15,
        alignItems: 'center',
        marginBottom: 16,
    },
    icon: {
        fontSize: 60,
        color: '#fff',
    },
    tileText: {
        color: '#fff',
        marginTop: 8,
        fontSize: 14,
    },
    header: {
        color: '#ffffff',
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 40,
        textAlign: 'center',
    },
    scrollContent: {
  paddingBottom: 40,
},
description: {
  color: '#ffffff',
  fontSize: 16,
  textAlign: 'center',
  marginBottom: 20,
},

});
