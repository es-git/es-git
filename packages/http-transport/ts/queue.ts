
export default class Queue<T>{
  private head? : Link<T>;
  private tail? : Link<T>;

  constructor(initial? : T[]){
    if(!initial) return;
    this.push(...initial);
  }

  push(...values : T[]) {
    for(const value of values){
      const link = {
        value
      };

      if(this.tail){
        this.tail.next = link;
      }

      this.tail = link;

      if(!this.head){
        this.head = link;
      }
    }
  }

  pop() : T | undefined
  pop(count : number) : T[]
  pop(count? : number) {
    if(count && count > 0){
      const result : T[] = [];
      for(let i=0; i<count; i++){
        const popped = this.pop();
        if(!popped) break;
        result[i] = popped;
      }
      return result;
    }
    const head = this.head;
    if(!head) return;
    this.head = head.next;
    if(!this.head){
      this.tail = undefined;
    }

    return head.value;
  }

  get isEmpty(){
    return this.head === undefined;
  }
}

interface Link<T> {
  readonly value : T
  next? : Link<T>
}