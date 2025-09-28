/* eslint-disable no-console */

export class Logger {
  static log = (...args: string[]): void => {
    console.log(...args);
  };

  static error = (...args: string[]): void => {
    console.error(...args);
  };
}
