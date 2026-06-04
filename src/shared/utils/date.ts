import {
  eachMonthOfInterval,
  format,
  isWithinInterval,
  parseISO,
  startOfMonth,
  subMonths,
} from 'date-fns';

export const subtractMonthsFromDate = (date: string, months: number) =>
  format(subMonths(parseISO(date), months), 'yyyy-MM-dd');

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
