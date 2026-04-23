/**
 * AlarmCard.js — Reusable alarm list item component.
 * Extracted from AlarmSetScreen for testability.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { COLORS } from '../constants/theme';

const PRESET_RINGTONES = ['alarm.mp3', 'chime.mp3', 'digital.mp3'];

export default function AlarmCard({ item, onToggle, onDelete }) {
  return (
    <View style={styles.alarmItem} testID={`alarm-card-${item.id}`}>
      <View style={styles.alarmInfo}>
        <Text style={styles.alarmTimeText} testID={`alarm-time-${item.id}`}>
          {item.time}
        </Text>
        <Text style={styles.alarmSubText} testID={`alarm-task-${item.id}`}>
          {item.taskType}  ·  {PRESET_RINGTONES.includes(item.ringtone) ? item.ringtone.split('.')[0] : 'Custom'}
        </Text>
      </View>
      <View style={styles.alarmActions}>
        <Switch
          testID={`alarm-toggle-${item.id}`}
          trackColor={{ false: '#cbd5e1', true: COLORS.primary }}
          thumbColor={item.enabled ? '#fff' : '#f4f3f4'}
          onValueChange={() => onToggle(item.id, item.enabled)}
          value={item.enabled}
        />
        <TouchableOpacity
          testID={`alarm-delete-${item.id}`}
          onPress={() => onDelete(item.id)}
          style={styles.deleteBtn}
        >
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  },
  alarmInfo: { flex: 1 },
  alarmTimeText: { fontSize: 36, fontWeight: 'bold', color: COLORS.text },
  alarmSubText: { color: COLORS.textSecondary, fontSize: 13, marginTop: 4 },
  alarmActions: { alignItems: 'flex-end', gap: 8 },
  deleteBtn: { marginTop: 4, paddingVertical: 4, paddingHorizontal: 8 },
  deleteBtnText: { color: COLORS.error, fontWeight: '600', fontSize: 13 },
});
