import {
  eachMonthOfInterval,
  format,
  isWithinInterval,
  parseISO,
  startOfMonth,
  subMonths,
} from 'date-fns';

const SCORING_WINDOW_MONTHS = 6;

export const getScoringWindow = (to: string) => {
  const endDate = parseISO(to);
  const startDate = startOfMonth(subMonths(endDate, SCORING_WINDOW_MONTHS - 1));

  return {
    from: format(startDate, 'yyyy-MM-dd'),
    to,
  };
};

export const getMonthKey = (date: string) => format(parseISO(date), 'yyyy-MM');

export const getMonthLabel = (monthKey: string) => format(parseISO(`${monthKey}-01`), 'MMM yyyy');

export const getMonthsInRange = (from: string, to: string) => {
  const startDate = startOfMonth(parseISO(from));
  const endDate = startOfMonth(parseISO(to));

  return eachMonthOfInterval({
    start: startDate,
    end: endDate,
  }).map((date) => format(date, 'yyyy-MM'));
};

export const isDateWithinRange = (date: string, from: string, to: string) => {
  return isWithinInterval(parseISO(date), {
    start: parseISO(from),
    end: parseISO(to),
  });
};
