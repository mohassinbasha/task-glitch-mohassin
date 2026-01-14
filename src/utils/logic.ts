import { DerivedTask, Task } from '@/types';

/* ------------------ BASIC HELPERS ------------------ */

export function daysBetween(a: string | Date, b: string | Date): number {
  const d1 = new Date(a).getTime();
  const d2 = new Date(b).getTime();
  if (isNaN(d1) || isNaN(d2)) return 0;
  return Math.abs(Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)));
}

export function computeROI(revenue: number, timeTaken: number): number | null {
  const rev = Number(revenue);
  const time = Number(timeTaken);
  if (!Number.isFinite(rev) || !Number.isFinite(time) || time <= 0) return null;
  return rev / time;
}

export function computePriorityWeight(priority: Task['priority']): 3 | 2 | 1 {
  switch (priority) {
    case 'High': return 3;
    case 'Medium': return 2;
    default: return 1;
  }
}

/* ------------------ DERIVED TASK ------------------ */

export function withDerived(task: Task): DerivedTask {
  return {
    ...task,
    roi: computeROI(task.revenue, task.timeTaken),
    priorityWeight: computePriorityWeight(task.priority),
  };
}

export function sortTasks(tasks: ReadonlyArray<DerivedTask>): DerivedTask[] {
  return [...tasks].sort((a, b) => {
    const aROI = a.roi ?? -Infinity;
    const bROI = b.roi ?? -Infinity;

    if (bROI !== aROI) return bROI - aROI;
    if (b.priorityWeight !== a.priorityWeight) return b.priorityWeight - a.priorityWeight;

    const aCreated = new Date(a.createdAt).getTime();
    const bCreated = new Date(b.createdAt).getTime();
    if (aCreated !== bCreated) return aCreated - bCreated;

    return String(a.id ?? '').localeCompare(String(b.id ?? ''));
  });
}

/* ------------------ ANALYTICS ------------------ */

export function computeTotalRevenue(tasks: ReadonlyArray<Task>): number {
  return tasks
    .filter(t => t.status === 'Done')
    .reduce((sum, t) => sum + (Number(t.revenue) || 0), 0);
}

export function computeTotalTimeTaken(tasks: ReadonlyArray<Task>): number {
  return tasks.reduce((sum, t) => sum + (Number(t.timeTaken) || 0), 0);
}

export function computeTimeEfficiency(tasks: ReadonlyArray<Task>): number {
  if (tasks.length === 0) return 0;
  const done = tasks.filter(t => t.status === 'Done').length;
  return (done / tasks.length) * 100;
}

export function computeRevenuePerHour(tasks: ReadonlyArray<Task>): number {
  const revenue = computeTotalRevenue(tasks);
  const time = computeTotalTimeTaken(tasks);
  return time > 0 ? revenue / time : 0;
}

export function computeAverageROI(tasks: ReadonlyArray<Task>): number {
  const rois = tasks
    .map(t => computeROI(t.revenue, t.timeTaken))
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  if (rois.length === 0) return 0;
  return rois.reduce((s, r) => s + r, 0) / rois.length;
}

export function computePerformanceGrade(avgROI: number): 'Excellent' | 'Good' | 'Needs Improvement' {
  if (avgROI > 500) return 'Excellent';
  if (avgROI >= 200) return 'Good';
  return 'Needs Improvement';
}

/* ------------------ DASHBOARD FUNCTIONS ------------------ */

export function computeThroughputByWeek(tasks: ReadonlyArray<Task>) {
  const map: Record<string, number> = {};

  tasks
    .filter(t => t.status === 'Done')
    .forEach(t => {
      // ✅ Only use existing fields: completedAt or createdAt
      const dateStr = t.completedAt ?? t.createdAt;
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return;
      const startOfYear = new Date(date.getFullYear(), 0, 1);
      const weekNum = Math.ceil((((date.getTime() - startOfYear.getTime()) / 86400000) + startOfYear.getDay() + 1) / 7);
      const key = `${date.getFullYear()}-W${weekNum}`;
      map[key] = (map[key] ?? 0) + 1;
    });

  return Object.entries(map).map(([week, count]) => ({ week, count }));
}

export function computeWeightedPipeline(tasks: ReadonlyArray<Task>): number {
  return tasks
    .filter(t => t.status !== 'Done')
    .reduce((sum, t) => sum + computePriorityWeight(t.priority) * (Number(t.revenue) || 0), 0);
}

export function computeVelocityByPriority(tasks: ReadonlyArray<Task>) {
  const result: Record<string, number> = { High: 0, Medium: 0, Low: 0 };

  tasks
    .filter(t => t.status === 'Done')
    .forEach(t => {
      if (t.priority && result[t.priority] !== undefined) result[t.priority] += 1;
    });

  return result;
}

export function computeForecast(tasks: ReadonlyArray<Task>): number {
  const done = tasks.filter(t => t.status === 'Done');
  if (done.length === 0) return 0;

  const avgPerTask = computeTotalRevenue(done) / done.length;
  return avgPerTask * tasks.length;
}
