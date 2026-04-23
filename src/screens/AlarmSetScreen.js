import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  Platform, FlatList, Modal, Switch, ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS } from '../constants/theme';
import { useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  getAlarms,
  addAlarm as addAlarmToStorage,
  deleteAlarm as deleteAlarmFromStorage,
  toggleAlarm as toggleAlarmInStorage,
  saveCustomRingtone,
} from '../services/StorageService';
import { scheduleAlarmNotification, cancelAlarmNotifications } from '../services/AlarmScheduler';

// expo-document-picker — native only
let DocumentPicker = null;
if (Platform.OS !== 'web') {
  DocumentPicker = require('expo-document-picker');
}

const PRESET_RINGTONES = ['alarm.mp3', 'chime.mp3', 'digital.mp3'];

export default function AlarmSetScreen() {
  const isFocused = useIsFocused();
  const webFileInputRef = useRef(null);

  const [alarms, setAlarms]             = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // New Alarm Form State
  const [date, setDate]         = useState(new Date());
  const [taskType, setTaskType] = useState('Math Problem');
  const [ringtone, setRingtone] = useState('alarm.mp3');
  const [customRingtoneName, setCustomRingtoneName] = useState('');

  useEffect(() => {
    if (isFocused) loadAlarms();
  }, [isFocused]);

  const loadAlarms = async () => {
    try {
      const data = await getAlarms();
      setAlarms(Array.isArray(data) ? data : []);
    } catch (e) {
      console.log('Load alarms error:', e);
    }
  };

  const openModal = () => {
    setDate(new Date());
    setTaskType('Math Problem');
    setRingtone('alarm.mp3');
    setCustomRingtoneName('');
    setIsModalVisible(true);
  };

  // ─── Pick custom ringtone ────────────────────────────────────────────────
  const pickCustomRingtone = async () => {
    if (Platform.OS === 'web') {
      // Web: trigger hidden file input
      if (webFileInputRef.current) webFileInputRef.current.click();
    } else {
      // Native: expo-document-picker
      if (!DocumentPicker) return;
      try {
        const result = await DocumentPicker.getDocumentAsync({
          type: 'audio/*',
          copyToCacheDirectory: true,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const file = result.assets[0];
          const filename = file.name || `custom_${Date.now()}.mp3`;
          const saved = await saveCustomRingtone({ uri: file.uri, filename });
          if (saved.success) {
            setRingtone(filename);
            setCustomRingtoneName(filename);
          } else {
            Alert.alert('Error', 'Could not save ringtone.');
          }
        }
      } catch (e) {
        Alert.alert('Error', 'Could not pick ringtone file.');
      }
    }
  };

  // Web file input change handler
  const handleWebFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const filename = file.name || `custom_${Date.now()}.mp3`;
    // On web: create a blob URL — FileSystem not available
    const blobUrl = URL.createObjectURL(file);
    // Store the blob URL as ringtone URI for playback on web
    setRingtone(blobUrl);
    setCustomRingtoneName(filename);
  };

  // ─── Add alarm ───────────────────────────────────────────────────────────
  const addAlarm = async () => {
    const hours   = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    try {
      const result = await addAlarmToStorage({
        time: timeStr,
        taskType,
        ringtone,
        label: customRingtoneName ? `Custom: ${customRingtoneName}` : '',
      });
      if (result.success) {
        try {
          await scheduleAlarmNotification({ id: result.id, time: timeStr, taskType, ringtone });
        } catch (e) {}
        setIsModalVisible(false);
        loadAlarms();
      }
    } catch (e) {
      Alert.alert('Error', 'Could not add alarm.');
    }
  };

  // ─── Delete alarm ────────────────────────────────────────────────────────
  const deleteAlarm = async (id) => {
    try {
      await cancelAlarmNotifications(id);
      await deleteAlarmFromStorage(id);
      loadAlarms();
    } catch (e) {
      Alert.alert('Error', 'Could not delete alarm.');
    }
  };

  // ─── Toggle alarm ────────────────────────────────────────────────────────
  const toggleAlarm = async (id, enabled) => {
    try {
      const newEnabled = !enabled;
      await toggleAlarmInStorage(id, newEnabled);
      if (newEnabled) {
        const alarmList = await getAlarms();
        const alarm = alarmList.find(a => a.id === id);
        if (alarm) await scheduleAlarmNotification(alarm);
      } else {
        await cancelAlarmNotifications(id);
      }
      loadAlarms();
    } catch (e) {
      console.log('Toggle error:', e);
    }
  };

  // ─── Render alarm item ───────────────────────────────────────────────────
  const renderAlarmItem = ({ item }) => (
    <View style={styles.alarmItem}>
      <View style={styles.alarmInfo}>
        <Text style={styles.alarmTimeText}>{item.time}</Text>
        <Text style={styles.alarmSubText}>
          {item.taskType}  ·  {
            PRESET_RINGTONES.includes(item.ringtone)
              ? item.ringtone.split('.')[0]
              : item.ringtone?.startsWith('blob:')
              ? '🎵 Custom'
              : item.ringtone
              ? '🎵 Custom'
              : 'alarm'
          }
        </Text>
      </View>
      <View style={styles.alarmActions}>
        <Switch
          trackColor={{ false: '#cbd5e1', true: COLORS.primary }}
          thumbColor={item.enabled ? '#fff' : '#f4f3f4'}
          onValueChange={() => toggleAlarm(item.id, item.enabled)}
          value={item.enabled}
        />
        <TouchableOpacity onPress={() => deleteAlarm(item.id)} style={styles.deleteBtn}>
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ─── Ringtone display name ───────────────────────────────────────────────
  const ringtoneDisplayName = () => {
    if (customRingtoneName) return `🎵 ${customRingtoneName}`;
    if (PRESET_RINGTONES.includes(ringtone)) return ringtone.split('.')[0];
    return ringtone;
  };

  return (
    <View style={styles.container}>

      {/* Hidden web file input for custom ringtone */}
      {Platform.OS === 'web' && React.createElement('input', {
        ref: webFileInputRef,
        type: 'file',
        accept: 'audio/*',
        style: { display: 'none' },
        onChange: handleWebFileChange,
      })}

      <View style={styles.headerRow}>
        <Text style={styles.title}>Your Alarms</Text>
        <Text style={styles.subtitle}>{alarms.length} alarm{alarms.length !== 1 ? 's' : ''} set</Text>
      </View>

      <FlatList
        data={alarms}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderAlarmItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>⏰</Text>
            <Text style={styles.emptyText}>No alarms set yet</Text>
            <Text style={styles.emptySubText}>Tap + to add your first alarm</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 120 }}
      />

      <TouchableOpacity style={styles.fab} onPress={openModal}>
        <LinearGradient colors={[COLORS.primaryVariant, COLORS.primary]} style={styles.fabGradient}>
          <Text style={styles.fabText}>+</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* ── Add Alarm Modal ── */}
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>New Alarm</Text>

              {/* Time Picker */}
              {Platform.OS === 'web'
                ? React.createElement('input', {
                    type: 'time',
                    value: `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`,
                    onChange: (e) => {
                      const val = e.target.value;
                      if (val) {
                        const [hours, minutes] = val.split(':');
                        const newDate = new Date();
                        newDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
                        setDate(newDate);
                      }
                    },
                    style: {
                      fontSize: '48px', color: COLORS.primary,
                      backgroundColor: '#f8fafc', padding: '20px',
                      borderRadius: '16px', border: '1px solid #e2e8f0',
                      marginBottom: '24px', textAlign: 'center',
                      fontWeight: 'bold', width: '100%',
                      cursor: 'pointer', boxSizing: 'border-box',
                    },
                  })
                : (
                  <View style={{ alignItems: 'center', marginBottom: 20 }}>
                    <DateTimePicker
                      value={date}
                      mode="time"
                      display="spinner"
                      onChange={(e, d) => { if (d) setDate(d); }}
                    />
                  </View>
                )}

              {/* Task Type */}
              <Text style={styles.sectionTitle}>Wake-Up Task</Text>
              <View style={styles.row}>
                {['Math Problem', 'Memory Game', 'Shake to Wake'].map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.taskBtn, taskType === type && styles.taskBtnActive]}
                    onPress={() => setTaskType(type)}
                  >
                    <Text style={[styles.taskText, taskType === type && { color: '#fff' }]}>
                      {type === 'Math Problem' ? '🧮 Math' : type === 'Memory Game' ? '🧠 Memory' : '📱 Shake'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Ringtone — Presets */}
              <Text style={styles.sectionTitle}>Ringtone</Text>
              <View style={styles.row}>
                {PRESET_RINGTONES.map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.taskBtn, ringtone === s && styles.taskBtnActive]}
                    onPress={() => { setRingtone(s); setCustomRingtoneName(''); }}
                  >
                    <Text style={[styles.taskText, ringtone === s && { color: '#fff' }]}>
                      🔔 {s.split('.')[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Custom Ringtone Upload */}
              <TouchableOpacity style={styles.customRingtoneBtn} onPress={pickCustomRingtone}>
                <Text style={styles.customRingtoneBtnText}>
                  🎵 {customRingtoneName ? `Selected: ${customRingtoneName}` : 'Upload Custom Ringtone'}
                </Text>
              </TouchableOpacity>

              {customRingtoneName ? (
                <View style={styles.selectedRingtoneBox}>
                  <Text style={styles.selectedRingtoneText}>
                    ✅ {customRingtoneName}
                  </Text>
                  <TouchableOpacity onPress={() => { setRingtone('alarm.mp3'); setCustomRingtoneName(''); }}>
                    <Text style={{ color: COLORS.error, fontSize: 12, marginTop: 4 }}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {/* Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.cancelBtn}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={addAlarm} style={styles.saveBtn}>
                  <Text style={styles.saveBtnText}>Save Alarm</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingTop: 60 },
  headerRow: { paddingHorizontal: 24, marginBottom: 20 },
  title: { color: COLORS.text, fontSize: 30, fontWeight: 'bold' },
  subtitle: { color: COLORS.textSecondary, fontSize: 14, marginTop: 4 },

  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyEmoji: { fontSize: 56, marginBottom: 12 },
  emptyText: { color: COLORS.text, fontSize: 18, fontWeight: 'bold', marginBottom: 6 },
  emptySubText: { color: COLORS.textSecondary, fontSize: 14 },

  alarmItem: {
    backgroundColor: '#fff', marginHorizontal: 20, marginVertical: 8,
    padding: 20, borderRadius: 24, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: '#f1f5f9', ...COLORS.shadow,
  },
  alarmInfo: { flex: 1 },
  alarmTimeText: { fontSize: 36, fontWeight: 'bold', color: COLORS.text },
  alarmSubText: { color: COLORS.textSecondary, fontSize: 13, marginTop: 4, textTransform: 'capitalize' },
  alarmActions: { alignItems: 'flex-end', gap: 8 },
  deleteBtn: { marginTop: 4, paddingVertical: 4, paddingHorizontal: 8 },
  deleteBtnText: { color: COLORS.error, fontWeight: '600', fontSize: 13 },

  fab: {
    position: 'absolute', bottom: 32, right: 28,
    width: 64, height: 64, borderRadius: 32,
    ...COLORS.shadow, shadowColor: COLORS.primary, shadowOpacity: 0.4,
  },
  fabGradient: { flex: 1, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  fabText: { color: '#fff', fontSize: 36, fontWeight: '300', lineHeight: 40 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#fff', borderTopLeftRadius: 32,
    borderTopRightRadius: 32, padding: 28, maxHeight: '92%',
  },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginBottom: 16, textAlign: 'center' },
  sectionTitle: {
    color: COLORS.textSecondary, fontSize: 13, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginTop: 20,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  taskBtn: { backgroundColor: '#f1f5f9', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center' },
  taskBtnActive: { backgroundColor: COLORS.primary },
  taskText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 13 },

  // Custom Ringtone
  customRingtoneBtn: {
    marginTop: 14,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  customRingtoneBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },
  selectedRingtoneBox: {
    marginTop: 10, backgroundColor: '#ede9fe',
    borderRadius: 12, padding: 12, alignItems: 'center',
  },
  selectedRingtoneText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },

  modalActions: { flexDirection: 'row', marginTop: 28, gap: 12, paddingBottom: 10 },
  cancelBtn: { flex: 1, padding: 18, borderRadius: 16, backgroundColor: '#f1f5f9', alignItems: 'center' },
  cancelBtnText: { color: COLORS.textSecondary, fontWeight: 'bold' },
  saveBtn: { flex: 2, padding: 18, borderRadius: 16, backgroundColor: COLORS.primary, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
