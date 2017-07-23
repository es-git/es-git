export interface Options {
  max? : number,
  maxAge? : number
};

interface Element<TKey, TValue> {
  value : TValue,
  prev : TKey | null,
  next : TKey | null,
  modified : number
}

export default class LRU<TKey, TValue> {
  private cache : Map<TKey, Element<TKey, TValue>>
  private head : any
  private tail : any
  private length : number
  private max : number
  private maxAge : number
  constructor({max = 1000, maxAge = 0} : Options = {}) {
    this.cache = new Map<TKey, Element<TKey, TValue>>();
    this.head = this.tail = null;
    this.length = 0;
    this.max = max;
    this.maxAge = maxAge;
  }

  get keys() {
    return Object.keys(this.cache);
  }

  clear() {
    this.cache = new Map<TKey, Element<TKey, TValue>>();
    this.head = this.tail = null;
    this.length = 0;
  }

  remove(key : TKey) {
    if (!this.cache.has(key)) return

    var element = this._safeGet(key) || undefined as never;
    this.cache.delete(key);
    this._unlink(key, element.prev, element.next);
    return element.value;
  }

  private _unlink(key : TKey, prev : TKey | null, next : TKey | null) {
    this.length--

    if (this.length === 0) {
      this.head = this.tail = null
    } else {
      if (this.head === key) {
        this.head = prev
        this._safeGet(this.head).next = null
      } else if (this.tail === key) {
        this.tail = next
        this._safeGet(this.tail).prev = null
      } else {
        this._safeGet(prev).next = next
        this._safeGet(next).prev = prev
      }
    }
  }

  peek(key : TKey) {
    if (!this.cache.has(key)) return

    var element = this._safeGet(key);

    if (!this._checkAge(key, element)) return
    return element.value
  }

  set(key : TKey, value : TValue) {
    var element

    if (this.cache.has(key)) {
      element = this._safeGet(key);
      element.value = value
      if (this.maxAge) element.modified = Date.now()

      // If it's already the head, there's nothing more to do:
      if (key === this.head) return value
      this._unlink(key, element.prev, element.next)
    } else {
      element = {value: value, modified: 0, next: null, prev: null}
      if (this.maxAge) element.modified = Date.now()
      this.cache.set(key, element);

      // Eviction is only possible if the key didn't already exist:
      if (this.length === this.max) this.evict()
    }

    this.length++
    element.next = null
    element.prev = this.head

    if (this.head) this._safeGet(this.head).next = key
    this.head = key

    if (!this.tail) this.tail = key
    return value
  }

  private _checkAge(key : TKey, element : Element<TKey, TValue>) {
    if (this.maxAge && (Date.now() - element.modified) > this.maxAge) {
      this.remove(key)
      return false
    }
    return true
  }

  get(key : TKey) {
    if (!this.cache.has(key)) return

    var element = this._safeGet(key) || undefined as never;
    if (!this._checkAge(key, element)) return

    if (this.head !== key) {
      if (key === this.tail) {
        this.tail = element.next;
        this._safeGet(this.tail).prev = null
      } else {
        // Set prev.next -> element.next:
        this._safeGet(element.prev).next = element.next
      }

      // Set element.next.prev -> element.prev:
      this._safeGet(element.next).prev = element.prev

      // Element is the new head
      this._safeGet(this.head).next = key
      element.prev = this.head
      element.next = null
      this.head = key
    }

    return element.value
  }

  evict() {
    if (!this.tail) return
    var key = this.tail
    var value = this.remove(this.tail)
  }

  private _safeGet(key : TKey | null){
    if(!key) throw new Error('whut???');
    return this.cache.get(key) || undefined as never;
  }
}