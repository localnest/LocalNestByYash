'use client';

import React from 'react';
import AppDatePicker from './AppDatePicker';
import AppSelect, { type AppSelectOption } from './AppSelect';

interface AppDateTimePickerProps {
  /** Local date-time, `YYYY-MM-DDTHH:mm` (same shape as `<input type="datetime-local">`). */
  value: string;
  onChange: (value: string) => void;
  min?: string;
  id?: string;
  label: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

function buildTimeOptions(current: string): AppSelectOption[] {
  const options: AppSelectOption[] = [];
  for (let minutes = 0; minutes < 24 * 60; minutes += 30) {
    const value = `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
    options.push({ value, label: value });
  }
  if (current && !options.some((option) => option.value === current)) {
    options.push({ value: current, label: current });
    options.sort((a, b) => a.value.localeCompare(b.value));
  }
  return options;
}

export default function AppDateTimePicker({
  value,
  onChange,
  min,
  id,
  label,
}: AppDateTimePickerProps) {
  const [date = '', time = '09:00'] = value.split('T');

  return (
    <div className="app-datetime">
      <AppDatePicker
        id={id}
        label={`${label} date`}
        value={date}
        min={min?.slice(0, 10)}
        onChange={(nextDate) => onChange(`${nextDate}T${time}`)}
      />
      <AppSelect
        label={`${label} time`}
        value={time}
        options={buildTimeOptions(time)}
        onChange={(nextTime) => onChange(`${date}T${nextTime}`)}
      />
    </div>
  );
}
