import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  Platform, FlatList, Modal, Switch, ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS } from '../constants/theme';
import { useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const createElement = Platform.OS === 'web' ? require('react').createElement : null;

export default function AlarmSetScreen() {
  const isFocused = useIsFocused();
  const [alarms, setAlarms] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // New Alarm Form State
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [taskType, setTaskType] = useState('Math Problem');
  const [ringtone, setRingtone] = useState('alarm.mp3');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isFocused) loadAlarms();
  }, [isFocused]);

  const loadAlarms = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/alarms');
      const data = await res.json();
      setAlarms(Array.isArray(data) ? data : []);
    } catch (e) {
      console.log('Load alarms error:', e);
    }
  };

  const openModal = () => {
    // FIX: reset form state every time modal opens
    setDate(new Date());
    setTaskType('Math Problem');
    setRingtone('alarm.mp3');
    setIsModalVisible(true);
  };

  const handleCustomUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('ringtone', file);
    try {
      const res = await fetch('http://localhost:3000/api/user/upload-ringtone', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setRingtone(data.filename);
        Alert.alert('Success', 'Custom ringtone uploaded!');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to upload ringtone.');
    }
  };

  const addAlarm = async () => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    try {
      const res = await fetch('http://localhost:3000/api/alarms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ time: timeStr, taskType, ringtone }),
      });
      const data = await res.json();
      if (data.success) {
        setIsModalVisible(false);
        loadAlarms();
      }
    } catch (e) {
      Alert.alert('Error', 'Could not add alarm. Is the backend running?');
    }
  };

  const deleteAlarm = async (id) => {
    try {
      await fetch(`http://localhost:3000/api/alarms/${id}`, { method: 'DELETE' });
      loadAlarms();
    } catch (e) {
      Alert.alert('Error', 'Could not delete alarm.');
    }
  };

  const toggleAlarm = async (id, enabled) => {
    try {
      await fetch(`http://localhost:3000/api/alarms/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !enabled }),
      });
      loadAlarms();
    } catch (e) {
      console.log('Toggle error:', e);
    }
  };

  const PRESET_RINGTONES = ['alarm.mp3', 'chime.mp3', 'digital.mp3'];

  const renderAlarmItem = ({ item }) => (
    <View style={styles.alarmItem}>
      <View style={styles.alarmInfo}>
        <Text style={styles.alarmTimeText}>{item.time}</Text>
        <Text style={styles.alarmSubText}>
          {item.taskType}  ·  {PRESET_RINGTONES.includes(item.ringtone) ? item.ringtone.split('.')[0] : 'Custom'}
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

  return (
    <View style={styles.container}>
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
        <LinearGradient
          colors={[COLORS.primaryVariant, COLORS.primary]}
          style={styles.fabGradient}
        >
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
                ? createElement('input', {
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
                      fontSize: '48px',
                      color: COLORS.primary,
                      backgroundColor: '#f8fafc',
                      padding: '20px',
                      borderRadius: '16px',
                      border: '1px solid #e2e8f0',
                      marginBottom: '24px',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      width: '100%',
                      cursor: 'pointer',
                      boxSizing: 'border-box',
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

              {/* Sound */}
              <Text style={styles.sectionTitle}>Ringtone</Text>
              <View style={styles.row}>
                {PRESET_RINGTONES.map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.taskBtn, ringtone === s && styles.taskBtnActive]}
                    onPress={() => setRingtone(s)}
                  >
                    <Text style={[styles.taskText, ringtone === s && { color: '#fff' }]}>
                      {s.split('.')[0]}
                    </Text>
                  </TouchableOpacity>
                ))}

                {Platform.OS === 'web' && (
                  <TouchableOpacity
                    style={[styles.taskBtn, !PRESET_RINGTONES.includes(ringtone) && styles.taskBtnActive]}
                    onPress={() => {
                      // FIX: null-check before calling click()
                      if (fileInputRef.current) fileInputRef.current.click();
                    }}
                  >
                    <Text style={[styles.taskText, !PRESET_RINGTONES.includes(ringtone) && { color: '#fff' }]}>
                      {!PRESET_RINGTONES.includes(ringtone) ? '✅ Uploaded' : '📁 Upload'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Hidden file input for web */}
              {Platform.OS === 'web' && createElement('input', {
                type: 'file',
                accept: 'audio/*',
                style: { display: 'none' },
                ref: fileInputRef,
                onChange: handleCustomUpload,
              })}

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
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 60,
  },
  headerRow: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  title: {
    color: COLORS.text,
    fontSize: 30,
    fontWeight: 'bold',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  emptyText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  emptySubText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  alarmItem: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 8,
    padding: 20,
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    ...COLORS.shadow,
  },
  alarmInfo: {
    flex: 1,
  },
  alarmTimeText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  alarmSubText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  alarmActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  deleteBtn: {
    marginTop: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  deleteBtnText: {
    color: COLORS.error,
    fontWeight: '600',
    fontSize: 13,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 28,
    width: 64,
    height: 64,
    borderRadius: 32,
    ...COLORS.shadow,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.4,
  },
  fabGradient: {
    flex: 1,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '300',
    lineHeight: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 28,
    maxHeight: '92%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 20,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  taskBtn: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  taskBtnActive: {
    backgroundColor: COLORS.primary,
  },
  taskText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 28,
    gap: 12,
    paddingBottom: 10,
  },
  cancelBtn: {
    flex: 1,
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: COLORS.textSecondary,
    fontWeight: 'bold',
  },
  saveBtn: {
    flex: 2,
    padding: 18,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
