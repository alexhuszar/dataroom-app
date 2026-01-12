export const formatDateTime = (
  date: string,
  locale: 'en-US' | 'en-GB' = 'en-US',
  options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true, 
  },
) => {
  return new Date(date).toLocaleString(locale, options);
};


export function withTimestamps<T extends object>(data: T) {
  const timestamp = new Date().toISOString();

  return {
    ...data,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updateTimestamp<T extends object>(data: T) {
  return {
    ...data,
    updatedAt: new Date().toISOString(),
  };
}
