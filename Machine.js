function numOperator(self, num1, num2, callback) {
    const n1 = num1.get();
    const n2 = num2.get();

    self.registers.res = callback(n1, n2);
}

const instructionCode = {
    test: function(){
        console.log(this.registers.res);
    },
    time: function(){
        console.time('timer');
    },
    timeEnd: function(){
        console.timeEnd('timer');
    },

    NOP: function(){},
    mov: function(src, dest){
        dest.set(src.get());
    },
    add: function(num1, num2){
        numOperator(this, num1, num2, (a, b) => a + b);
    },
    sub: function(num1, num2){
        numOperator(this, num1, num2, (a, b) => a - b);
    },
    mul: function(num1, num2){
        numOperator(this, num1, num2, (a, b) => a * b);
    },
    div: function(num1, num2){
        numOperator(this, num1, num2, (a, b) => a / b);
    },
    cmp: function(num1, num2){
        numOperator(this, num1, num2, (a, b) => Math.sign(a - b));
    },
    jmp: function(dest){
        this.registers.lp = Math.max(Math.min(dest.get()), 0) - 1;
    },
    jre: function(dest){
        this.registers.lp += Math.max(Math.min(dest.get()), 0) - 1;
    },
    jlt: function(dest){
        if (this.registers.res >= 0) return;
        this.registers.lp = Math.max(Math.min(dest.get()), 0) - 1;
    },
    jgt: function(dest){
        if (this.registers.res <= 0) return;
        this.registers.lp = Math.max(Math.min(dest.get()), 0) - 1;
    },
    jle: function(dest){
        if (this.registers.res > 0) return;
        this.registers.lp = Math.max(Math.min(dest.get()), 0) - 1;
    },
    jge: function(dest){
        if (this.registers.res < 0) return;
        this.registers.lp = Math.max(Math.min(dest.get()), 0) - 1;
    },
    jeq: function(dest){
        if (this.registers.res != 0) return;
        this.registers.lp = Math.max(Math.min(dest.get()), 0) - 1;
    },
    push: function(val){
        const data = val.get();
        this.registers.stp--;

        if (this.registers.stp < 0){
            throw new Error(`Error, stack overflow on line: ${this.registers.lp}`);
        }

        this.memory[this.registers.stp] = data;
    },
    pop: function(srcArg){
        const data = srcArg == undefined ? 1 : srcArg.get();
        this.registers.stp = Math.min(this.registers.stp + data, this.registers.vm);
    },
    ret: function(){
        this.registers.lp = this.registers.ret;
    },
    call: function(insNum){
        this.executeSysCall(insNum);
    },
    end: function(){
        this.registers.lp = this.instructions.length;
    },
}

const sysFunctions = [
    //log
    function (){
        console.log(this.registers.r1);
    }
];

class Machine {
    static MEMORY_SIZE = 1024 * 2;

    isRunning = true;
    memory = new Uint8ClampedArray(Machine.MEMORY_SIZE);
    instructions;
    registers = {
        lp: 0,
        r1: 0,
        r2: 0,
        r3: 0,
        r4: 0,
        res: 0,
        sys: 0,
        vm: Machine.MEMORY_SIZE - 224,
        vl: 0,
        vb: 0,
        ret: 0,
        stp: 0,
    }

    constructor(code){
        const lines = code.split('\n')
            .map(i => i.trim());
        const labelMap = this.getLabelMap(lines);
        this.instructions = lines
            .map((line, lineNumber) => this.parseInstruction(lineNumber, line, labelMap));
        
        this.registers.stp = this.registers.vm;
    }

    getLabelMap(lines){
        const labelMap = new Map();

        lines.forEach((line, lineNumber) => {
            if (line[0] != ':') return;
            labelMap.set(line, lineNumber);
        });

        return labelMap;
    }

    getMemoryAccessor(addrAccessor){
        return {
            get: ()=>this.getMemory(addrAccessor()),
            set: (val)=>this.setMemory(addrAccessor(), val),
        }
    }

    parseArgument(arg, lineNumber, labelMap) {
        //parse numerical values
        if (!isNaN(arg)){
            const val = parseInt(arg);
            return {get: ()=>val, set: ()=>{}};
        }

        //parse labels
        if (arg[0] == ':'){
            const mapGet = labelMap.get(arg);

            if (mapGet == undefined){
                throw new Error(`Error on line: ${lineNumber}. Cannot find declaration of label ${arg}`);
            }

            return {get: ()=>mapGet, set: ()=>{}};
        }

        //parse registers
        if (arg in this.registers){
            return {
                get: ()=>this.registers[arg],
                set: (val)=>this.registers[arg] = val,
            };
        }

        //parse memory addresses
        const slice = arg.slice(1);
        const accessor = this.parseArgument(slice, lineNumber, labelMap);

        if (arg[0] == '&'){
            return this.getMemoryAccessor(accessor.get);
        }

        if (arg[0] == '$'){
            return this.getMemoryAccessor(()=>this.registers.stp + accessor.get());
        }

        //throw error if argument is none of the above
        throw new Error(`Error, unknown symbol: '${arg}' on line: ${lineNumber}`);
    }

    parseInstruction(lineNumber, line, labelMap){
        //check non-instruction lines
        const isEmpty = line.length == 0;
        const isComment = line[0] == '#';
        const isLabel = line[0] == ':';

        if (isEmpty || isComment || isLabel){
            return instructionCode.NOP;
        }

        const tokens = line.split(' ');
        const instructionName = tokens[0];
        const instruction = instructionCode[instructionName];
        const args = [];

        if (!instruction) {
            console.error(`Error, unknown instruction: ${instructionName} : ${lineNumber}`);
            return instructionCode.NOP;
        }

        //parse args
        for (let i = 1; i < tokens.length; i++){
            if (tokens[i].length == 0){
                continue;
            }

            if (tokens[i][0] == '#'){
                i = tokens.length;
                continue;
            }

            const result = this.parseArgument(tokens[i], lineNumber, labelMap);

            if (result){
                args.push(result);
            }
        }
        
        return instruction.bind(this, ...args);
    }

    getMemory(addr){
        if (addr < 0 || addr >= this.memory.length){
            throw new Error(`Error on line: ${this.registers.lp}. Memory value of ${addr} is out of bounds`);
        }

        return this.memory[addr];
    }

    setMemory(addr, val){
        if (addr < 0 || addr >= this.memory.length){
            throw new Error(`Error on line: ${this.registers.lp}. Memory value of ${addr} is out of bounds`);
        }

        this.memory[addr] = val;
    }

    execute() {
        do {
            const instruction = this.instructions[this.registers.lp]();
            this.registers.lp++;
        } while(this.registers.lp < this.instructions.length);
    }

    executeSysCall(funcNum){
        if (sysFunctions[funcNum] == undefined){
            throw new Error(`Error on line ${this.registers.lp}, system function number ${funcNum} does not exist`);
        }
        sysFunctions[funcNum].call(this);
    }

    draw(ctx){
        //console.time('render');
        const canvas = ctx.canvas;
        const imgData = new ImageData(canvas.width, canvas.height);

        this.registers.vb = 0;

        for (let y = 0; y < canvas.height; y++){
            const rowPtr = y * canvas.width * 4;

            this.registers.lp = 0;
            this.registers.vl = y;
            this.execute();

            for (let x = 0; x < canvas.width; x++){
                const pxPtr = rowPtr + x * 4;
                const vMemVal = Math.min(this.memory[this.registers.vm + x], 1);
                imgData.data[pxPtr + 0] = vMemVal * 255;
                imgData.data[pxPtr + 1] = vMemVal * 255;
                imgData.data[pxPtr + 2] = vMemVal * 255;
                imgData.data[pxPtr + 3] = 255;
            }
        }
        ctx.putImageData(imgData, 0, 0);

        this.registers.vb = 1;
        this.registers.lp = 0;
        this.execute();
        //console.timeEnd('render');
    }
}