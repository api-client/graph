export declare interface SentinelItem {
  _next: SentinelItem;
  _prev: SentinelItem;
}

export const sentinelValue: unique symbol;

/*
 * Simple doubly linked list implementation derived from Cormen, et al.,
 * "Introduction to Algorithms".
 */
export class List {
  [sentinelValue]: SentinelItem;

  constructor();

  dequeue(): any;
  
  enqueue(entry: any): void;
  
  toString(): string;
}
