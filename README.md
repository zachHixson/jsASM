# jsASM

A small experimental virtual machine built in Javascript

### How to run included examples

Simply run the `index.html` from the example's folder.

### How to use virtual machine with your own assembly

- Import the `Machine.js` file
- Construct the virtual machine with `new Machine(asm_text)`
    - Optionally a `settings` object can be provided to customize memory example. Available setings are `{memory, videoMemory, inputs}`. See included examples for relevant settings
- `yourMachine.run(canvas_context)` - Runs ths machine for one cycle
- `yourMachine.setInput(input_idx, value)` can be used to pass input values from Javascript into your assembly code

### General Operation

- The machine will execute the code once for every vertical line in the supplied canvas, then copy the current video memory to the respective line on the canvas
- The machine will the simulate a "v-blank," and run the code once again without copying video memory to the canvas

### Registers

All registers are capable of holding floating point values of any size Javascript can store. Memory is limited to Int16 values.

- lp - Current line being executed
- r1 through r4 - General purpose registers
- res - Stores the result of math and compare instructions
- vm - Starting address for video memory
- vl - Current line being rendered
- vb - Set to 1 during screen v-blank
- inp - Starting address for input memory
- stp - Current stack pointer
- ret - Stores line number to return to after `ret` instruction is called. Automatically set by `call` instruction.


### Instructions

General Instructions:

- NOP - Does nothing
- mov `src` `dest` - Moves value from `src` to `dest`
- add `num1` `num2` - Adds two numbers, stores result in `res`
- sub `num1` `num2` - Subtracts two numbers, stores result in `res`
- mul `num1` `num2` - Multiplies two numbers, stores result in `res`
- div `num1` `num2` - Divides two numbers, stores result in `res`
- min `num1` `num2` - Computes minimum of two numbers, stores result in `res`
- max `num1` `num2` - Computes maximum of two numbers, stores result in `res`
- abs `num1` - Computes absolute value of `num`, stores result in `res`
- rnd `num1` - Rounds `num`, stores result in `res`
- cmp `num1` `num2` - Compares two numbers, stores result in `res`.
    - Less than `res` = `-1`
    - Equal to `res` = `0`
    - Greater than `res` = `1`

Jump Instructions (best used along side `cmp`):

- jmp `line_number` - Jumps to given line number
- jre `number` - Jumps relative to current line based on provided value
- jlt `line_number` - Jumps to given line number if `res` is less than 0
- jgt `line_number` - Jumps to given line number if `res` is greater than 0
- jle `line_number` - Jumps to given line number if `res` is less than or equal to 0
- jge `line_number` - Jumps to given line number if `res` is greater than or equal to 0
- jeq `line_number` - Jumps to given line number if `res` is equal to 0
- jne `line_number` - Jumps to given line number if `res` is not equal to 0

Stack Instructions:

- push `value` - Pushes value to the stack
- pop `value` - Pops specifies values off of the stack. Does not clear memory. Default value is `1` if none is provided

Control Flow Instructions:

- call - Jumps to the specified line number, and sets `ret` register to return to current line number
- ret - Returns to value specified in `ret` register

Debugging Instructions:

- log `val` - logs out provided value to browser console
- time - starts performance timer
- timeEnd - stops performance timer and logs result to console
- dbg - stops execution and triggers javascript debugger

Accessing Memory:

- `&value` - Accesses specified memory address
- `$value` - Accesses specified position on the stack. Most recently pushed value is `$0`.
- [name of register] - Accesses specified register
- `:labelName` - Replaced at compile time with the line number of the corresponding label.
    - NOTE: The above only applies when used as an argument. For use as an instruction, see below.

Misc:

- `:labelName` - Declares position in code for use with the `:labelName` arguments. Replaced at compile time with `NOP` instruction.
- `# comment` - Comment. Replaced at compile time with `NOP` instruction.