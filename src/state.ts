// Run state shared between scenes. Snapshot taken at the start of each day for replays.
import type { UpgradeId } from './data';

export interface RunState {
  day: number;
  yen: number;
  upgrades: UpgradeId[];
}

export interface DayStats {
  served: number;
  missed: number;
  earned: number;
  stars: number;
  failed: boolean;
}

// Dev shortcuts: ?day=3 jumps to a day, ?dur=15 shortens shifts.
const params = new URLSearchParams(location.search);
export const debug = { day: Number(params.get('day')) || 0, dur: Number(params.get('dur')) || 0 };

export const run: RunState = newRun();
let snapshot = '';

export function newRun(): RunState {
  return { day: 0, yen: 0, upgrades: [] };
}

export function resetRun() {
  Object.assign(run, newRun());
}

export function saveSnapshot() {
  snapshot = JSON.stringify(run);
}

export function restoreSnapshot() {
  if (snapshot) Object.assign(run, JSON.parse(snapshot));
}

export const hasUpgrade = (id: UpgradeId) => run.upgrades.includes(id);
