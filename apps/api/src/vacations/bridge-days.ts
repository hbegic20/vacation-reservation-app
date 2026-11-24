import { addDays, daysBetweenInclusive, isWeekendKey } from "../common/dates";

export interface BridgeSuggestion {
  leaveStart: string;
  leaveEnd: string;
  offStart: string;
  offEnd: string;
  leaveDays: number;
  daysOff: number;
  holidays: string[];
}

export interface BridgeSearch {
  firstDay: string;
  lastDay: string;
  holidays: ReadonlyMap<string, string>;
  blockedDays: ReadonlySet<string>;
  availableDays: number;
  limit: number;
}

const maxLeaveDays = 4;
const maxGapPerSide = 4;

interface Gap {
  workingDays: string[];
  offEdge: string;
}

function isOff(key: string, holidays: ReadonlyMap<string, string>): boolean {
  return isWeekendKey(key) || holidays.has(key);
}

function walkOff(
  from: string,
  step: 1 | -1,
  holidays: ReadonlyMap<string, string>,
): string {
  let edge = from;
  while (isOff(addDays(edge, step), holidays)) {
    edge = addDays(edge, step);
  }
  return edge;
}

function gapBeside(
  edge: string,
  step: 1 | -1,
  holidays: ReadonlyMap<string, string>,
): Gap | null {
  const workingDays: string[] = [];
  let cursor = addDays(edge, step);
  while (!isOff(cursor, holidays)) {
    workingDays.push(cursor);
    if (workingDays.length > maxGapPerSide) {
      return null;
    }
    cursor = addDays(cursor, step);
  }
  return { workingDays, offEdge: walkOff(cursor, step, holidays) };
}

function buildSuggestion(
  leave: string[],
  offStart: string,
  offEnd: string,
  holidays: ReadonlyMap<string, string>,
): BridgeSuggestion {
  const sorted = [...leave].sort();
  const names: string[] = [];
  for (let key = offStart; key <= offEnd; key = addDays(key, 1)) {
    const name = holidays.get(key);
    if (name && !names.includes(name)) {
      names.push(name);
    }
  }
  return {
    leaveStart: sorted[0],
    leaveEnd: sorted[sorted.length - 1],
    offStart,
    offEnd,
    leaveDays: sorted.length,
    daysOff: daysBetweenInclusive(offStart, offEnd),
    holidays: names,
  };
}

function candidatesFor(
  clusterStart: string,
  clusterEnd: string,
  holidays: ReadonlyMap<string, string>,
): BridgeSuggestion[] {
  const left = gapBeside(clusterStart, -1, holidays);
  const right = gapBeside(clusterEnd, 1, holidays);
  const candidates: BridgeSuggestion[] = [];
  if (left && left.workingDays.length > 0) {
    candidates.push(
      buildSuggestion(left.workingDays, left.offEdge, clusterEnd, holidays),
    );
  }
  if (right && right.workingDays.length > 0) {
    candidates.push(
      buildSuggestion(right.workingDays, clusterStart, right.offEdge, holidays),
    );
  }
  if (
    left &&
    right &&
    left.workingDays.length > 0 &&
    right.workingDays.length > 0 &&
    left.workingDays.length + right.workingDays.length <= maxLeaveDays
  ) {
    candidates.push(
      buildSuggestion(
        [...left.workingDays, ...right.workingDays],
        left.offEdge,
        right.offEdge,
        holidays,
      ),
    );
  }
  return candidates;
}

function isBetter(a: BridgeSuggestion, b: BridgeSuggestion): boolean {
  const ratioA = a.daysOff / a.leaveDays;
  const ratioB = b.daysOff / b.leaveDays;
  return ratioA > ratioB || (ratioA === ratioB && a.leaveDays < b.leaveDays);
}

function isAllowed(
  suggestion: BridgeSuggestion,
  search: BridgeSearch,
): boolean {
  if (suggestion.leaveStart < search.firstDay) {
    return false;
  }
  if (suggestion.leaveDays > search.availableDays) {
    return false;
  }
  for (
    let key = suggestion.leaveStart;
    key <= suggestion.leaveEnd;
    key = addDays(key, 1)
  ) {
    if (search.blockedDays.has(key)) {
      return false;
    }
  }
  return true;
}

export function suggestBridgeDays(search: BridgeSearch): BridgeSuggestion[] {
  const suggestions: BridgeSuggestion[] = [];
  let key = search.firstDay;
  while (key <= search.lastDay) {
    if (!isOff(key, search.holidays)) {
      key = addDays(key, 1);
      continue;
    }
    const clusterEnd = walkOff(key, 1, search.holidays);
    const hasWeekdayHoliday = Array.from(search.holidays.keys()).some(
      (holiday) =>
        holiday >= key && holiday <= clusterEnd && !isWeekendKey(holiday),
    );
    if (hasWeekdayHoliday) {
      const best = candidatesFor(key, clusterEnd, search.holidays)
        .filter((candidate) => isAllowed(candidate, search))
        .reduce<BridgeSuggestion | null>(
          (current, candidate) =>
            !current || isBetter(candidate, current) ? candidate : current,
          null,
        );
      if (best) {
        suggestions.push(best);
      }
    }
    key = addDays(clusterEnd, 1);
  }
  return suggestions.slice(0, search.limit);
}
