/* eslint-disable no-param-reassign */
/* eslint-disable no-bitwise */
/** @typedef {import('../graph/types').PriorityQueueItem} PriorityQueueItem */

export const queueValue = Symbol('queueValue');
export const keyIndicesValue = Symbol('keyIndicesValue');
export const swap = Symbol('swap');
export const decrease = Symbol('decrease');
export const heapify = Symbol('heapify');

/**
 * A min-priority queue data structure. This algorithm is derived from Cormen,
 * et al., "Introduction to Algorithms". The basic idea of a min-priority
 * queue is that you can efficiently (in O(1) time) get the smallest key in
 * the queue. Adding and removing elements takes O(log n) time. A key can
 * have its priority decreased in O(log n) time.
 */
export class PriorityQueue {
  constructor() {
    /**
     * @type {PriorityQueueItem[]}
     */
    this[queueValue] = [];
    /**
     * @type {Record<string, number>}
     */
    this[keyIndicesValue] = {};
  }

  /**
   * Returns the number of elements in the queue. Takes `O(1)` time.
   * 
   * @returns {number}
   */
  size() {
    return this[queueValue].length;
  }

  /**
   * Returns the keys that are in the queue. Takes `O(n)` time.
   * @returns {string[]}
   */
  keys() {
    return this[queueValue].map(x => x.key);
  }

  /**
   * Returns `true` if **key** is in the queue and `false` if not.
   * 
   * @param {any} key
   * @returns {boolean}
   */
  has(key) {
    return typeof this[keyIndicesValue][String(key)] !== 'undefined';
  }

  /**
   * Returns the priority for **key**. If **key** is not present in the queue
   * then this function returns `undefined`. Takes `O(1)` time.
   *
   * @param {any} key
   */
  priority(key) {
    const index = this[keyIndicesValue][String(key)];
    if (index !== undefined) {
      return this[queueValue][index].priority;
    }
    return undefined;
  }

  /**
   * Returns the key for the minimum element in this queue. If the queue is
   * empty this function throws an Error. Takes `O(1)` time.
   */
  min() {
    if (this.size() === 0) {
      throw new Error("Queue underflow");
    }
    return this[queueValue][0].key;
  }

  /**
   * Inserts a new key into the priority queue. If the key already exists in
   * the queue this function returns `false`; otherwise it will return `true`.
   * Takes `O(n)` time.
   *
   * @param {any} key the key to add
   * @param {number} priority the initial priority for the key
   */
  add(key, priority) {
    const keyIndices = this[keyIndicesValue];
    const queueKey = String(key);
    const has = Object.prototype.hasOwnProperty.call(keyIndices, queueKey);
    if (!has) {
      const arr = this[queueValue];
      const index = arr.length;
      keyIndices[queueKey] = index;
      arr.push({ key: queueKey, priority });
      this[decrease](index);
      return true;
    }
    return false;
  }

  /**
   * Removes and returns the smallest key in the queue. Takes `O(log n)` time.
   */
  removeMin() {
    this[swap](0, this[queueValue].length - 1);
    const min = this[queueValue].pop();
    delete this[keyIndicesValue][min.key];
    this[heapify](0);
    return min.key;
  }

  /**
   * Decreases the priority for **key** to **priority**. If the new priority is
   * greater than the previous priority, this function will throw an Error.
   *
   * @param {any} key the key for which to raise priority
   * @param {number} priority the new priority for the key
   */
  decrease(key, priority) {
    const index = this[keyIndicesValue][String(key)];
    if (priority > this[queueValue][index].priority) {
      throw new Error(`${"New priority is greater than current priority. " +
          "Key: "}${  key  } Old: ${  this[queueValue][index].priority  } New: ${  priority}`);
    }
    this[queueValue][index].priority = priority;
    this[decrease](index);
  }

  /**
   * @param {number} i 
   */
  [heapify](i) {
    const arr = this[queueValue];
    const l = 2 * i;
    const r = l + 1;
    let largest = i;
    if (l < arr.length) {
      largest = arr[l].priority < arr[largest].priority ? l : largest;
      if (r < arr.length) {
        largest = arr[r].priority < arr[largest].priority ? r : largest;
      }
      if (largest !== i) {
        this[swap](i, largest);
        this[heapify](largest);
      }
    }
  }

  /**
   * @param {number} index
   */
  [decrease](index) {
    const arr = this[queueValue];
    const {priority} = arr[index];
    let parent;
    while (index !== 0) {
      parent = index >> 1;
      if (arr[parent].priority < priority) {
        break;
      }
      this[swap](index, parent);
      index = parent;
    }
  }

  /**
   * @param {number} i 
   * @param {number} j 
   */
  [swap](i, j) {
    const arr = this[queueValue];
    const keyIndices = this[keyIndicesValue];
    const origArrI = arr[i];
    const origArrJ = arr[j];
    arr[i] = origArrJ;
    arr[j] = origArrI;
    keyIndices[origArrJ.key] = i;
    keyIndices[origArrI.key] = j;
  }
}
