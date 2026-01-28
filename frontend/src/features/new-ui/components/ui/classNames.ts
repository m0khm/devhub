export const cn = (...classes: Array<string | null | false | undefined>) =>
  classes.filter(Boolean).join(' ');
