export const formatTimestamp = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
};

export const validateAppId = (id) => {
  return /^\d{17,19}$/.test(id);
};

export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};
