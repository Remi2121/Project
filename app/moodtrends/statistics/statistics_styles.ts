import { StyleSheet } from 'react-native';

const PRIMARY = '#2a1faa';
const FG = '#0022ffff';
const MUTED = '#0055ffff';
const CARD = '#ffffff';
const CARD_BORDER = '#005effff';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },

  innerWrap: {
    flex: 1,
    paddingTop: 30,
  },

  backButton: {
    position: 'absolute',
    justifyContent: 'center',
    top: 16,
    left: 12,
    zIndex: 10,
    borderRadius: 800,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  backIcon: {
    color: PRIMARY,
    fontSize: 30,
    fontWeight: '700',
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
  },
  muted: {
    color: MUTED,
    marginTop: 8,
    textAlign: 'center',
  },
  error: {
    color: '#ef4444',
    textAlign: 'center',
  },

  tabs: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 44,
    paddingBottom: 8,
    backgroundColor: '#ffffff',
  },
  tabBtn: {
    flex: 1,
    backgroundColor: '#f6f8fb',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e6edf9',
  },
  tabBtnActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  tabTxt: {
    color: MUTED,
    fontWeight: '600',
  },
  tabTxtActive: {
    color: '#ffffff',
    fontWeight: '700',
  },

  card: {
    backgroundColor: CARD,
    height:'auto',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: CARD_BORDER,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },

  h2: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    color: FG,
  },
  sub: {
    color: MUTED,
    marginTop: 6,
  },

  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  legendItem: {
    color: MUTED,
    marginRight: 12,
  },

  axis: {
    color: MUTED,
    fontSize: 12,
  },

  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f6ff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  dateTxt: {
    color: FG,
    fontSize: 14,
  },
  dateMood: {
    color: PRIMARY,
    fontSize: 16,
    fontWeight: '700',
  },

  avgBig: {
    fontSize: 28,
    fontWeight: '800',
    color: FG,
    marginTop: 4,
  },
});

export default styles;
