export function formatRelative(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date - now;
  const diffMin = Math.round(diffMs / 60000);

  if (diffMs > 0) {
    if (diffMin < 60) return `In ${diffMin} min`;
    if (diffMin < 24 * 60) return `In ${Math.round(diffMin / 60)}h`;
    return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  const pastMin = -diffMin;
  if (pastMin < 1) return 'Just now';
  if (pastMin < 60) return `${pastMin} min ago`;
  if (pastMin < 24 * 60) return `${Math.round(pastMin / 60)}h ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}