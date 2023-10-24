// global immutability lock
// eslint-disable-next-line import/no-mutable-exports
export let LOCKED = true;

export function lock() {
  LOCKED = true;
}

export function unlock() {
  LOCKED = false;
}