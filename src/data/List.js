/** @typedef {import('./List').SentinelItem} SentinelItem */

export const sentinelValue = Symbol('sentinel');

/* eslint-disable no-param-reassign */
/**
 * @param {SentinelItem} entry 
 */
function unlink(entry) {
  entry._prev._next = entry._next;
  entry._next._prev = entry._prev;
  delete entry._next;
  delete entry._prev;
}

/**
 * 
 * @param {string} k 
 * @param {SentinelItem} v 
 * @returns {SentinelItem|undefined}
 */
function filterOutLinks(k, v) {
  if (k !== "_next" && k !== "_prev") {
    return v;
  }
  return undefined;
}

/*
 * Simple doubly linked list implementation derived from Cormen, et al.,
 * "Introduction to Algorithms".
 */
export class List {
  constructor() {
    const sentinel = /** @type SentinelItem */ ({});
    sentinel._next = sentinel;
    sentinel._prev = sentinel;
    this[sentinelValue] = sentinel;
  }

  dequeue() {
    const sentinel = this[sentinelValue];
    const entry = sentinel._prev;
    if (entry !== sentinel) {
      unlink(entry);
      return entry;
    }
    return undefined;
  }
  
  /**
   * @param {SentinelItem} entry 
   */
  enqueue(entry) {
    const sentinel = this[sentinelValue];
    if (entry._prev && entry._next) {
      unlink(entry);
    }
    entry._next = sentinel._next;
    sentinel._next._prev = entry;
    sentinel._next = entry;
    entry._prev = sentinel;
  };
  
  toString() {
    const parts = [];
    const sentinel = this[sentinelValue];
    let curr = sentinel._prev;
    while (curr !== sentinel) {
      parts.push(JSON.stringify(curr, filterOutLinks));
      curr = curr._prev;
    }
    return `[${parts.join(", ")}]`;
  }
}
