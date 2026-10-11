import type { Group } from './types'

/** Fallback group: can be renamed but never deleted. */
export const OTHER_GROUP_ID = 'other'

export const DEFAULT_GROUPS: readonly Group[] = [
  { id: 'lived', name: 'Lived', color: '#2563eb', icon: 'house' },
  { id: 'vacations', name: 'Vacations', color: '#ea580c', icon: 'plane' },
  { id: 'job', name: 'Job', color: '#475569', icon: 'briefcase' },
  { id: 'friends', name: 'Friends', color: '#16a34a', icon: 'users' },
  { id: 'wish-list', name: 'Wish list', color: '#9333ea', icon: 'star' },
  { id: OTHER_GROUP_ID, name: 'Other', color: '#6b7280', icon: 'map-pin' },
]
