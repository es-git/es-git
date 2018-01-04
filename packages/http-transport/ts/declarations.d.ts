interface Array<T> {
  filter<U extends T>(pred: (a: T, i : number, e : Array<T>) => a is U): U[];
}