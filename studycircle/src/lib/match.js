export function normCourse(raw = '') {
  const s = String(raw).toUpperCase().replace(/\s+/g, ' ').trim()
  const m = s.match(/^([A-Z]+)\s*(\d.*)$/)
  return m ? `${m[1]} ${m[2].trim()}` : s
}
export const validCourse = (code) => /^[A-Z0-9][A-Z0-9 .&-]{1,19}$/.test(code)
export const sameGoal = (a, b) =>
  !!a &&
  String(a).trim().toLowerCase() ===
    String(b || '')
      .trim()
      .toLowerCase()
export function overlap(a = [], b = []) {
  const set = new Set(b)
  return a.filter((x) => set.has(x))
}
export function matchScore(user, group) {
  if (!user.courses.includes(group.course)) return 0
  const shared = overlap(user.availability, group.avail).length
  const base = group.avail.length ? shared / group.avail.length : 0
  const goal = sameGoal(user.goal, group.goal) ? 0.15 : 0
  return Math.round(Math.min(1, base * 0.85 + goal) * 100)
}
export const isMember = (group, id = 'me') => group.members.some((m) => m.id === id)
export const isFull = (group) => group.members.length >= group.capacity
export function suggestions(user, groups) {
  return groups
    .filter((g) => user.courses.includes(g.course) && !isMember(g) && !isFull(g))
    .map((g) => ({ group: g, score: matchScore(user, g), shared: overlap(user.availability, g.avail) }))
    .sort((a, b) => b.score - a.score)
}
export function autoMatch(user, groups) {
  const picks = []
  for (const code of user.courses) {
    if (groups.some((g) => g.course === code && isMember(g))) continue
    const best = suggestions(user, groups).find((s) => s.group.course === code)
    if (best) picks.push(best.group.id)
  }
  return picks
}
export const slotLabel = (s) => {
  const [d, b] = s.split('-')
  return `${d} ${{ Mor: 'AM', Aft: 'PM', Eve: 'Eve' }[b]}`
}
