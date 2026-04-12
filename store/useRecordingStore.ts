import { create } from 'zustand';

export type TimerFilterType = 'minimal' | 'dateStamp';
export type DeviceOrientation = 'portrait' | 'landscape-left' | 'landscape-right';

interface RecordingState {
  isSessionActive: boolean;
  isFinishing: boolean;
  isPreparing: boolean;
  isCountingDown: boolean;
  activeTaskId: string | null;

  // Timer overlay state
  timerPosition: { x: number; y: number };
  timerFilter: TimerFilterType;
  timerScale: number;

  // Device orientation
  deviceOrientation: DeviceOrientation;

  // Setters
  setIsSessionActive: (value: boolean) => void;
  setIsFinishing: (value: boolean) => void;
  setIsPreparing: (value: boolean) => void;
  setIsCountingDown: (value: boolean) => void;
  setActiveTaskId: (id: string | null) => void;
  setTimerPosition: (pos: { x: number; y: number }) => void;
  setTimerFilter: (filter: TimerFilterType) => void;
  setTimerScale: (scale: number) => void;
  setDeviceOrientation: (orientation: DeviceOrientation) => void;
}

export const useRecordingStore = create<RecordingState>((set) => ({
  isSessionActive: false,
  isFinishing: false,
  isPreparing: false,
  isCountingDown: false,
  activeTaskId: null,

  // Timer defaults: right-aligned, 3/4 down
  timerPosition: { x: 0.85, y: 0.75 },
  timerFilter: 'minimal',
  timerScale: 1.0,
  deviceOrientation: 'portrait',

  setIsSessionActive: (value) => set({ isSessionActive: value }),
  setIsFinishing: (value) => set({ isFinishing: value }),
  setIsPreparing: (value) => set({ isPreparing: value }),
  setIsCountingDown: (value) => set({ isCountingDown: value }),
  setActiveTaskId: (id) => set({ activeTaskId: id }),
  setTimerPosition: (pos) => set({ timerPosition: pos }),
  setTimerFilter: (filter) => set({ timerFilter: filter }),
  setTimerScale: (scale) => set({ timerScale: scale }),
  setDeviceOrientation: (orientation) => set({ deviceOrientation: orientation }),
}));
