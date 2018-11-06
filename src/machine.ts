// type Instractuion = { label: string; text: string };

class Instruction {
  _label: string = '';
  _proc = [];
  constructor(public text: string) {}
  get label() {
    return this._label;
  }
  set label(v) {
    this._label = v;
  }
  get proc() {
    return this._proc;
  }
  set proc(v) {
    this._proc = v;
  }
}

class Register {
  _content?: any = undefined; // []
  constructor(public name: string) {}
  get content(): any | undefined {
    return this._content;
  }

  set content(c: any | undefined) {
    this._content = c;
  }
}

class Stack {
  stack: { [name: string]: Register[] } = {};
  maxDepth = 0;
  numberPushs = 0;
  push(r: Register) {
    this.numberPushs++;
    const name = r.name;
    if (name in this.stack) {
      this.stack[name] = [r, ...this.stack[name]];
    } else {
      this.stack[name] = [r];
    }
    const size = this.stack[name].length;
    if (this.maxDepth < size) {
      this.maxDepth = size;
    }
  }
  pop(r: Register): Register | undefined {
    const name = r.name;
    return this.stack[name].pop();
  }
}

class Machine {
  pc: Register;
  flag: Register;
  stack: Stack;
  instructions: [];
  instrCount: number;
  traceFlag: boolean;
  registerTable: { [name: string]: Register } = {};
  operations = [];
  constructor() {
    this.pc = new Register('pc');
    this.flag = new Register('flag');
    this.stack = new Stack();
    this.instructions = [];
    this.instrCount = 0;
    this.traceFlag = false;
  }
  allocateRegister(name: string) {
    if (!(name in this.registerTable)) {
      this.registerTable[name] = new Register(name);
    }
  }
  lookupRegister(name: string): Register {
    if (!(name in this.registerTable)) {
      this.allocateRegister(name);
    }
    return this.registerTable[name];
  }
  trace(i: Instruction) {
    if (this.traceFlag && i.label) {
      console.log(`${i.label} >>> ${i.text}`);
    }
  }
  execute() {
    const insts = this.pc.content as Instruction[];
    if (!insts || insts.length === 0) {
      return;
    }
    const inst = insts[0];
    this.trace(inst);
    this.instrCount++;
    this.execute();
  }
}

const advancePC = (pc: Register) => {
  pc.content = pc.content.slice(1);
};
