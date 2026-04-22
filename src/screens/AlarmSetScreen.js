import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, createElement, FlatList, Modal, Switch, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS } from '../constants/theme';
import * as Notifications from 'expo-notifications';
import { useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function AlarmSetScreen() {
  const isFocused = useIsFocused();
  const [alarms, setAlarms] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  // New Alarm Form State
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [taskType, setTaskType] = useState('Math Problem'); // Math, Memory, Shake
  const [ringtone, setRingtone] = useState('alarm.mp3');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isFocused) {
      loadAlarms();
    }
  }, [isFocused]);

  const loadAlarms = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/alarms');
      const data = await res.json();
      setAlarms(data);
    } catch(e) {
      console.log(e);
    }
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
        Alert.alert("Success", "Custom ringtone uploaded!");
      }
    } catch (e) {
      Alert.alert("Error", "Failed to upload.");
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
        body: JSON.stringify({ time: timeStr, taskType, ringtone })
      });
      const data = await res.json();
      if (data.success) {
        setIsModalVisible(false);
        loadAlarms();
      }
    } catch (e) {
      Alert.alert("Error", "Could not add alarm.");
    }
  };

  const deleteAlarm = async (id) => {
    try {
      await fetch(`http://localhost:3000/api/alarms/${id}`, { method: 'DELETE' });
      loadAlarms();
    } catch (e) {
      Alert.alert("Error", "Could not delete.");
    }
  };

  const toggleAlarm = async (id, enabled) => {
    try {
      await fetch(`http://localhost:3000/api/alarms/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !enabled })
      });
      loadAlarms();
    } catch (e) {
      console.log(e);
    }
  };

  const renderAlarmItem = ({ item }) => (
    <View style={styles.alarmItem}>
      <View style={styles.alarmInfo}>
        <Text style={styles.alarmTimeText}>{item.time}</Text>
        <Text style={styles.alarmSubText}>{item.taskType} • {item.ringtone}</Text>
      </View>
      <View style={styles.alarmActions}>
        <Switch
          trackColor={{ false: '#cbd5e1', true: COLORS.primary }}
          thumbColor={item.enabled ? '#fff' : '#f4f3f4'}
          onValueChange={() => toggleAlarm(item.id, item.enabled)}
          value={item.enabled}
        />
        <TouchableOpacity onPress={() => deleteAlarm(item.id)} style={styles.deleteBtn}>
          <Text style={{color: COLORS.error, fontWeight: 'bold'}}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Your Alarms</Text>
      </View>

      <FlatList
        data={alarms}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderAlarmItem}
        ListEmptyComponent={<Text style={styles.emptyText}>No alarms set yet. Click + to add one!</Text>}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setIsModalVisible(true)}
      >
        <LinearGradient
          colors={[COLORS.primaryVariant, COLORS.primary]}
          style={styles.fabGradient}
        >
          <Text style={styles.fabText}>+</Text>
        </LinearGradient>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>New Alarm</Text>

              {Platform.OS === 'web' ? (
                createElement('input', {
                  type: 'time',
                  value: date.toTimeString().slice(0, 5),
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
                    border: `1px solid #e2e8f0`,
                    marginBottom: '30px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    width: '100%',
                    cursor: 'pointer',
                  }
                })
              ) : (
                <View style={{alignItems: 'center', marginBottom: 20}}>
                   <DateTimePicker
                    value={date}
                    mode="time"
                    display="spinner"
                    onChange={(e, d) => setDate(d || date)}
                  />
                </View>
              )}

              <Text style={styles.sectionTitle}>Task Type</Text>
              <View style={styles.row}>
                {['Math Problem', 'Memory Game', 'Shake to Wake'].map(type => (
                  <TouchableOpacity 
                    key={type}
                    style={[styles.taskBtn, taskType === type && styles.taskBtnActive]}
                    onPress={() => setTaskType(type)}
                  >
                    <Text style={[styles.taskText, taskType === type && {color: '#fff'}]}>
                      {type === 'Math Problem' ? 'Math' : type === 'Memory Game' ? 'Memory' : 'Shake'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionTitle}>Sound</Text>
              <View style={styles.row}>
                {['alarm.mp3', 'chime.mp3', 'digital.mp3'].map(s => (
                  <TouchableOpacity 
                    key={s}
                    style={[styles.taskBtn, ringtone === s && styles.taskBtnActive]}
                    onPress={() => setRingtone(s)}
                  >
                    <Text style={[styles.taskText, ringtone === s && {color: '#fff'}]}>
                      {s.split('.')[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity 
                  style={[styles.taskBtn, !['alarm.mp3', 'chime.mp3', 'digital.mp3'].includes(ringtone) && styles.taskBtnActive]}
                  onPress={() => Platform.OS === 'web' && fileInputRef.current.click()}
                >
                  <Text style={[styles.taskText, !['alarm.mp3', 'chime.mp3', 'digital.mp3'].includes(ringtone) && {color: '#fff'}]}>
                    {ringtone.length > 12 ? 'File ✅' : 'Upload'}
                  </Text>
                </TouchableOpacity>
              </View>

              {Platform.OS === 'web' && (
                createElement('input', {
                  type: 'file', accept: 'audio/*', style: { display: 'none' },
                  ref: fileInputRef, onChange: handleCustomUpload
                })
              )}

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
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: 'bold',
  },
  emptyText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 100,
    fontSize: 16,
  },
  alarmItem: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 20,
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    ...COLORS.shadow
  },
  alarmTimeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  alarmSubText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  alarmActions: {
    alignItems: 'flex-end',
  },
  deleteBtn: {
    marginTop: 10,
    padding: 5,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 65,
    height: 65,
    borderRadius: 33,
    ...COLORS.shadow,
    shadowOpacity: 0.4,
  },
  fabGradient: {
    flex: 1,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: {
    color: '#fff',
    fontSize: 35,
    fontWeight: '300',
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
    padding: 30,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 20,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  taskBtn: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginRight: 10,
    marginBottom: 10,
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
    marginTop: 30,
    gap: 15,
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
  }
});
