function numOperator(self, num1, num2, callback) {
    const n1 = self.getData(num1);
    const n2 = self.getData(num2);

    if (isNaN(n1) || isNaN(n2)){
        throw new Error(`Error on line: ${self.registers.lp}. Argument is NaN`);
    }

    self.registers.res = callback(n1, n2);
}

const instructionCode = {
    NOP: function(){},
    test: function(){
        console.log(this.memory[0], this.registers.r1);
    },
    mov: function(srcArg, destArg){
        const src = this.getData(srcArg);
        this.setData(destArg, src);
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
        this.registers.lp = Math.max(Math.min(this.getData(dest)), 0) - 1;
    },
    jre: function(dest){
        this.registers.lp += Math.max(Math.min(this.getData(dest)), 0) - 1;
    },
    jlt: function(dest){
        if (this.registers.res >= 0) return;
        this.registers.lp = Math.max(Math.min(this.getData(dest)), 0) - 1;
    },
    jgt: function(dest){
        if (this.registers.res <= 0) return;
        this.registers.lp = Math.max(Math.min(this.getData(dest)), 0) - 1;
    },
    jle: function(dest){
        if (this.registers.res > 0) return;
        this.registers.lp = Math.max(Math.min(this.getData(dest)), 0) - 1;
    },
    jge: function(dest){
        if (this.registers.res < 0) return;
        this.registers.lp = Math.max(Math.min(this.getData(dest)), 0) - 1;
    },
    jeq: function(dest){
        if (this.registers.res != 0) return;
        this.registers.lp = Math.max(Math.min(this.getData(dest)), 0) - 1;
    },
    push: function(srcArg){
        const data = this.getData(srcArg);
        this.registers.stp--;

        if (this.registers.stp < 0){
            throw new Error(`Error, stack overflow on line: ${this.registers.lp}`);
        }

        this.memory[this.registers.stp] = data;
    },
    pop: function(srcArg){
        const data = srcArg == undefined ? 1 : this.getData(srcArg);
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

    parseInstruction(lineNumber, line, labelMap){
        //check non-instruction lines
        const isEmpty = line.length == 0;
        const isComment = line[0] == '#';
        const isLabel = line[0] == ':';

        if (isEmpty || isComment || isLabel){
            return {instruction: instructionCode.NOP, args: []};
        }

        const tokens = line.split(' ');
        const instructionName = tokens[0];
        const instruction = instructionCode[instructionName];
        const args = [...tokens].splice(1);

        if (!instruction) {
            console.error(`Error, unknown instruction: ${instructionName} : ${lineNumber}`);
            return {instruction: instructionCode.NOP};
        }

        args.forEach((val, idx) => {
            if (val[0] == ':'){
                const mapGet = labelMap.get(val);
                if (mapGet == undefined) {
                    console.warn(`Error, could not find label with name ${val.slice(1)}. Replacing with line number 0`);
                    return;
                };
                args[idx] = mapGet;
            }

            if (val[0] == '#'){
                args.splice(idx);
                return;
            }

            if (!isNaN(val)){
                tokens[idx] = parseFloat(val);
            }
        });
        
        return {instruction: instruction.bind(this), args};
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

    getData(arg){
        if (isNaN(arg)){
            const slice = arg.slice(1);
            
            if (arg[0] == '&'){
                if (!isNaN(slice)){
                    return this.getMemory(parseInt(slice));
                }

                if (this.registers[slice] != undefined){
                    return this.getMemory(parseInt(this.registers[slice]));
                }
            }

            if (arg[0] == '$'){
                if (!isNaN(slice)){
                    const stackOffset = parseInt(slice);
                    return this.getMemory(this.registers.stp + stackOffset);
                }

                if (this.registers[slice] != undefined){
                    return this.memory[this.registers.stp + this.registers[slice]];
                }
            }

            const regGet = this.registers[arg];
            if (regGet == undefined){
                throw new Error(`Error, unknown register: ${arg} on line: ${this.registers.lp}`);
            }

            return regGet;
        }

        return parseInt(arg);
    }

    setData(arg, val){
        if (isNaN(arg)){
            const slice = arg.slice(1);
            
            if (arg[0] == '&'){
                if (!isNaN(slice)){
                    this.memory[parseInt(slice)] = val;
                    return;
                }

                if (this.registers[slice] != undefined){
                    this.memory[this.registers[slice]] = val;
                    return;
                }
            }

            if (arg[0] == '$'){
                if (!isNaN(slice)){
                    const stackOffset = parseInt(slice);
                    this.memory[this.registers.stp + stackOffset] = val;
                    return;
                }
                
                if (this.registers[slice] != undefined){
                    this.memory[this.registers.stp + this.registers[slice]] = val;
                    return;
                }
            }

            const regGet = this.registers[arg];
            if (regGet == undefined){
                throw new Error(`Error, unknown register: ${arg} on line: ${this.registers.lp}`);
            }

            this.registers[arg] = val;
            return;
        }

        throw new Error('Error on line:', this.registers.lp, 'invalid argument', arg);
    }

    execute() {
        do {
            const instruction = this.instructions[this.registers.lp];
            instruction.instruction(...instruction.args);
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
        const canvas = ctx.canvas;
        const imgData = new ImageData(canvas.width, canvas.height);

        ctx.imageSmoothingEnabled = false;

        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

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
    }
}