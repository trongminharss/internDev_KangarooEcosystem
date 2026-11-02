import moment from 'moment';

export const FDate = {
  yMd(inputDate: string): string {
    if (moment(inputDate, moment.ISO_8601, true).isValid()) {
      return moment(inputDate, moment.ISO_8601).format('YYYY-MM-DD');
    }
    return moment(inputDate, 'DD/MM/YYYY').format('YYYY/MM/DD');
  },

  dMy(inputDate: string): string {
    if (moment(inputDate, moment.ISO_8601, true).isValid()) {
      return moment(inputDate, moment.ISO_8601).format('DD/MM/YYYY');
    }
    return moment(inputDate, 'DD/MM/YYYY').format('DD/MM/YYYY');
  },

  /** ISO-8601 date + `months`, returned as `DD/MM/YYYY`. */
  addMonthsDMy(isoDate: string, months: number): string {
    return moment(isoDate, moment.ISO_8601)
      .add(months, 'months')
      .format('DD/MM/YYYY');
  },

  /** Whole days from today until (ISO-8601 date + `plusMonths`); negative once passed. */
  daysUntil(isoDate: string, plusMonths = 0): number {
    return moment(isoDate, moment.ISO_8601)
      .add(plusMonths, 'months')
      .diff(moment().startOf('day'), 'days');
  },

  /** Current local time as fractional hours, e.g. 13.5 for 13:30. */
  hourOfDay(): number {
    const now = moment();
    return now.hours() + now.minutes() / 60;
  },

  /** The next `count` days starting tomorrow, as `{iso, weekday: 0 (Sun)..6, dM: 'DD/MM'}`. */
  upcomingDays(count: number) {
    return Array.from({length: count}, (_, i) => {
      const d = moment().add(i + 1, 'days');
      return {
        iso: d.format('YYYY-MM-DD'),
        weekday: d.day(),
        dM: d.format('DD/MM'),
      };
    });
  },
};

export default FDate;
