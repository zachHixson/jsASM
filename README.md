# jsASM

A small experimental virtual machine built in Javascript

### How to use virtual machine

- Import the `Machine.js` file
- Construct the virtual machine with `new Machine(asm_text)`
    - Optionally a `settings` argument can be provided to customize memory example. See included `pong_example` for relevant settings
    - `yourMachine.setInput(input_idx, value)` can be used to pass input values from Javascript into your assembly code

### How to run Pong example

Simply download it and run `index.html`.