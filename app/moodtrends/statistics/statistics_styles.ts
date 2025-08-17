import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    
  },
  center: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 16 
  },
  muted: { 
    color: '#6b7280', 
    marginTop: 8, 
    textAlign: 'center' 
  },
  error: { 
    color: '#ef4444', 
    textAlign: 'center' 
  },

  tabs: {
    flexDirection: 'row',
    color: '#6695e8ff',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 40,
    paddingBottom: 4,
  },
  tabBtn: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#334155',
  },
  tabBtnActive: {
    backgroundColor: '#1e293b',
    borderColor: '#60a5fa',
  },
  tabTxt: { 
    color: '#9ca3af', 
    fontWeight: '600' 
  },
  tabTxtActive: { 
    color: '#e5e7eb' 
  },

  card: {
    backgroundColor: '#234387ff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#5487daff',
  },
  h2: { 
    fontSize: 18, 
    fontWeight: '700', 
    marginBottom: 8, 
    color: '#e5e7eb' 
  },
  sub: { 
    color: '#9ca3af', 
    marginTop: 6 
  },
  legendRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 8 
  },
  legendItem: { 
    color: '#9ca3af', 
    marginRight: 12 
  },
  axis: { 
    color: '#9ca3af' ,
    fontSize: 12
  },

  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#60a5fa',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  dateTxt: { 
    color: '#000000ff' 
  },
  dateMood: { 
    color: '#e5e7eb', 
    fontSize: 18 
  },

  avgBig: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: '#e5e7eb', 
    marginTop: 4 
  },
});

export default styles;
