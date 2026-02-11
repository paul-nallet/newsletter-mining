export function useNewsletterSelection() {
  const selectedIds = ref(new Set<string>())

  const selectionMode = computed(() => selectedIds.value.size > 0)
  const selectedCount = computed(() => selectedIds.value.size)

  function toggle(id: string) {
    const next = new Set(selectedIds.value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    selectedIds.value = next
  }

  function selectAll(ids: string[]) {
    selectedIds.value = new Set(ids)
  }

  function clearSelection() {
    selectedIds.value = new Set()
  }

  function isSelected(id: string) {
    return selectedIds.value.has(id)
  }

  return { selectedIds, selectionMode, selectedCount, toggle, selectAll, clearSelection, isSelected }
}
