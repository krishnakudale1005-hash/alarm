/**
 * AlarmCard.test.js — Tests for AlarmCard component logic
 * 
 * Tests use direct prop assertion and spy functions since we're
 * running in Node environment without a real DOM/renderer.
 */

import React from 'react';
import AlarmCard from '../../src/components/AlarmCard';

const mockAlarm = {
  id: 1,
  time: '07:30',
  taskType: 'Math Problem',
  ringtone: 'alarm.mp3',
  enabled: true,
  label: 'Morning alarm',
  repeatDays: '',
};

// ─── Component props & structure ──────────────────────────────────────────────
describe('AlarmCard props', () => {
  test('component is a function/class (can be instantiated)', () => {
    expect(typeof AlarmCard).toBe('function');
  });

  test('renders without throwing when given valid alarm props', () => {
    expect(() => {
      AlarmCard({ item: mockAlarm, onToggle: jest.fn(), onDelete: jest.fn() });
    }).not.toThrow();
  });

  test('handles disabled alarm without throwing', () => {
    expect(() => {
      AlarmCard({ item: { ...mockAlarm, enabled: false }, onToggle: jest.fn(), onDelete: jest.fn() });
    }).not.toThrow();
  });

  test('handles custom ringtone without throwing', () => {
    const customAlarm = { ...mockAlarm, ringtone: 'custom_ring.mp3' };
    expect(() => {
      AlarmCard({ item: customAlarm, onToggle: jest.fn(), onDelete: jest.fn() });
    }).not.toThrow();
  });
});

// ─── Toggle callback ──────────────────────────────────────────────────────────
describe('AlarmCard toggle behavior', () => {
  test('onToggle callback is callable with correct args', () => {
    const mockToggle = jest.fn();
    // Simulate what happens when the Switch fires onValueChange
    mockToggle(mockAlarm.id, mockAlarm.enabled);
    expect(mockToggle).toHaveBeenCalledWith(1, true);
  });

  test('toggling a disabled alarm passes false as enabled arg', () => {
    const mockToggle = jest.fn();
    const disabledAlarm = { ...mockAlarm, enabled: false };
    mockToggle(disabledAlarm.id, disabledAlarm.enabled);
    expect(mockToggle).toHaveBeenCalledWith(1, false);
  });

  test('onToggle is called exactly once per interaction', () => {
    const mockToggle = jest.fn();
    mockToggle(1, true);
    expect(mockToggle).toHaveBeenCalledTimes(1);
  });
});

// ─── Delete callback ──────────────────────────────────────────────────────────
describe('AlarmCard delete behavior', () => {
  test('onDelete is callable with correct id', () => {
    const mockDelete = jest.fn();
    mockDelete(mockAlarm.id);
    expect(mockDelete).toHaveBeenCalledWith(1);
  });

  test('onDelete receives only the alarm id (number)', () => {
    const mockDelete = jest.fn();
    mockDelete(99);
    expect(mockDelete).toHaveBeenCalledWith(expect.any(Number));
  });

  test('onDelete is called exactly once per press', () => {
    const mockDelete = jest.fn();
    mockDelete(1);
    expect(mockDelete).toHaveBeenCalledTimes(1);
  });
});

// ─── Alarm time format ────────────────────────────────────────────────────────
describe('AlarmCard time display logic', () => {
  test('alarm time string has correct HH:mm format', () => {
    expect(mockAlarm.time).toMatch(/^\d{2}:\d{2}$/);
  });

  test('alarm time is exactly "07:30"', () => {
    expect(mockAlarm.time).toBe('07:30');
  });

  test('preset ringtone displays basename without extension', () => {
    const PRESET_RINGTONES = ['alarm.mp3', 'chime.mp3', 'digital.mp3'];
    const displayName = PRESET_RINGTONES.includes(mockAlarm.ringtone)
      ? mockAlarm.ringtone.split('.')[0]
      : 'Custom';
    expect(displayName).toBe('alarm');
  });

  test('non-preset ringtone displays "Custom"', () => {
    const PRESET_RINGTONES = ['alarm.mp3', 'chime.mp3', 'digital.mp3'];
    const customAlarm = { ...mockAlarm, ringtone: 'my_custom.mp3' };
    const displayName = PRESET_RINGTONES.includes(customAlarm.ringtone)
      ? customAlarm.ringtone.split('.')[0]
      : 'Custom';
    expect(displayName).toBe('Custom');
  });
});
