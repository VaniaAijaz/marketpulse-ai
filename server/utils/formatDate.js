// Format: 07 Oct 2025, 03:45 PM
const formatDate = (date, locale = 'en-PK') => {
  if (!date) return null;

  const d = new Date(date);

  return d.toLocaleString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

// Format: 2025-10-07
const formatDateISO = (date) => {
  if (!date) return null;
  return new Date(date).toISOString().split('T')[0];
};

// Get time ago: "2 hours ago"
const timeAgo = (date) => {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} min ago`;
  return 'just now';
};

module.exports = { formatDate, formatDateISO, timeAgo };