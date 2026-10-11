import { OTHER_GROUP_ID } from './defaultGroups'
import type { MapData } from './types'

export function canDeleteGroup(groupId: string): boolean {
  return groupId !== OTHER_GROUP_ID
}

/**
 * Deletes a group and moves its places into `moveToGroupId`.
 * Places are never deleted along with their group.
 */
export function deleteGroup(data: MapData, groupId: string, moveToGroupId: string): MapData {
  if (!canDeleteGroup(groupId)) throw new Error('The Other group cannot be deleted')
  if (moveToGroupId === groupId) throw new Error('Cannot move places into the group being deleted')
  if (!data.groups.some((g) => g.id === moveToGroupId)) throw new Error(`Unknown group: ${moveToGroupId}`)
  return {
    ...data,
    groups: data.groups.filter((g) => g.id !== groupId),
    places: data.places.map((p) => (p.groupId === groupId ? { ...p, groupId: moveToGroupId } : p)),
  }
}
