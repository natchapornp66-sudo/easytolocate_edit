export function getRentalDates(start: Date, days: number) {
  const end = new Date(start);
  end.setDate(start.getDate() + days - 1);
  const format = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return { start_date: format(start), end_date: format(end) };
}
