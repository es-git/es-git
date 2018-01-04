export default class Terminal{
  string = '';
  newline = 0;
  cursor = 0;
  log(message : string){
    let pos = 0;
    while(pos < message.length){
      let cr = message.indexOf('\r', pos)+1;
      let lf = message.indexOf('\n', pos)+1;
      if(this.cursor < this.string.length){
        this.string = this.string.substring(0, this.cursor);
      }
      if(cr > 0 && (lf === 0 || cr < lf)){
        this.string = this.string + message.substring(pos, cr-1);
        pos = cr;
        this.cursor = this.newline;
      }else if(lf > 0){
        this.newline = this.string.length + lf;
        this.string = this.string + message.substring(pos, lf);
        pos = lf;
        this.cursor = this.string.length;
      }else{
        this.string = this.string + message.substring(pos);
        pos = message.length;
        this.cursor = this.string.length;
      }
    }
  }

  get content(){
    return this.string;
  }
}