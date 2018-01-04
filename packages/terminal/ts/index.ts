export default class Terminal{
  private _content = '';
  private _newline = 0;
  private _cursor = 0;
  private _onChange? : (content : string) => void
  constructor(onChange? : (content : string) => void){
    this._onChange = onChange;
  }

  log(message : string){
    let pos = 0;
    while(pos < message.length){
      let cr = message.indexOf('\r', pos)+1;
      let lf = message.indexOf('\n', pos)+1;
      if(this._cursor < this._content.length){
        this._content = this._content.substring(0, this._cursor);
      }
      if(cr > 0 && (lf === 0 || cr < lf)){
        this._content = this._content + message.substring(pos, cr-1);
        pos = cr;
        this._cursor = this._newline;
      }else if(lf > 0){
        this._newline = this._content.length + lf;
        this._content = this._content + message.substring(pos, lf);
        pos = lf;
        this._cursor = this._content.length;
      }else{
        this._content = this._content + message.substring(pos);
        pos = message.length;
        this._cursor = this._content.length;
      }
    }
    if(this._onChange) this._onChange(this._content);
    return this._content;
  }

  logLine(message : string){
    return this.log(message+'\n');
  }

  get content(){
    return this._content;
  }
}