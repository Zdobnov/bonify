import {
  eachMonthOfInterval,
  format,
  isWithinInterval,
  isValid,
  parseISO,
  startOfMonth,
  subMonths,
} from 'date-fns';

const SCORING_WINDOW_MONTHS = 6;

export const isValidDateString = (date: string) => {
  return Boolean(date) && isValid(parseISO(date));
};

export const getScoringWindow = (to: string) => {
  if (!isValidDateString(to)) {
    return null;
  }

  const endDate = parseISO(to);
  const startDate = startOfMonth(subMonths(endDate, SCORING_WINDOW_MONTHS - 1));

  return {
    from: format(startDate, 'yyyy-MM-dd'),
    to,
  };
};

export const getMonthKey = (date: string) => {
  if (!isValidDateString(date)) {
    return null;
  }

  return format(parseISO(date), 'yyyy-MM');
};

export const getMonthLabel = (monthKey: string) => {
  const monthDate = `${monthKey}-01`;

  if (!isValidDateString(monthDate)) {
    return monthKey;
  }

  return format(parseISO(monthDate), 'MMM yyyy');
};

export const getMonthsInRange = (from: string, to: string) => {
  if (!isValidDateString(from) || !isValidDateString(to)) {
    return [];
  }

  const startDate = startOfMonth(parseISO(from));
  const endDate = startOfMonth(parseISO(to));

  if (startDate > endDate) {
    return [];
  }

  return eachMonthOfInterval({
    start: startDate,
    end: endDate,
  }).map((date) => format(date, 'yyyy-MM'));
};

export const isDateWithinRange = (date: string, from: string, to: string) => {
  if (!isValidDateString(date) || !isValidDateString(from) || !isValidDateString(to)) {
    return false;
  }

  const start = parseISO(from);
  const end = parseISO(to);

  if (start > end) {
    return false;
  }

  return isWithinInterval(parseISO(date), {
    start,
    end,
  });
};
