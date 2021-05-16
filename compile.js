const fs = require('fs');
const { argv } = require('process');

const file = argv[2];

function increase(count) {
  return '+'.repeat(count);
}

/**
 * Sets current cell to 0 or 1
 * @returns Brainfuck instruction
 */
function to_bool(temp) {
  const t = parseInt(temp);
  return clear_relative(t) + '['+ move_relative(t) + '+' + move_relative(-t) +'[-]]' + move_relative(t) + move_value(-t) + move_relative(-t);
}

/**
 * Sets target cell to 0 or 1
 * @param {number} target Target to be converted to bool
 * @param {number} temp
 * @returns Brainfuck instruction
 */
function to_bool_relative(target, temp) {
  const n = parseInt(target);
  return move_relative(n) + to_bool(temp) + move_relative(-n);
}

/**
 * Not operator on current cell. 0 => 1, else 0
 * @returns Brainfuck instruction
 */
function negate(temp) {
  return to_bool(temp) + '-[++]';
}

function set_value(count) {
  const n = parseInt(count);
  return clear_cell() + (n < 0 ? decrease(-n) : increase(n));
}

function set_char(char) {
  return clear_cell() + increase(char.charCodeAt())
}

function set_string(...string) {
  string = string.join(' ');
  return string.split('').map(c => set_char(c) + move_right(1)).join('').slice(0, -1)
}

function decrease(count) {
  return '-'.repeat(count);
}

function move_relative(count) {
  const n = parseInt(count);
  return n < 0 ? move_left(-n) : move_right(n);
}

function move_right(count) {
  return '>'.repeat(count);
}

function move_left(count) {
  return '<'.repeat(count);
}

/**
 * Move the value of the current cell to a target cell
 * @param {number} relativeLocation Target cell
 * @returns Brainfuck instruction.
 */
function move_value(relativeLocation) {
  const n = parseInt(relativeLocation);
  const clear_target = move_relative(n) + clear_cell() + move_relative(-n);
  return clear_target + '[' + move_relative(n) + '+' + move_relative(-n) + '-]';
}

/**
 * Move Value at current cell to 2 cells at relative position
 * @param {number} relativeLocation1 
 * @param {number} relativeLocation2 
 * @returns Brainfuck instruction
 */
function move_value2(relativeLocation1, relativeLocation2) {
  const n1 = parseInt(relativeLocation1);
  const n2 = parseInt(relativeLocation2);
  const cl1 = clear_relative(n1);
  const cl2 = clear_relative(n2);
  return cl1 + cl2 + '[' + move_relative(n1) + '+' + move_relative(-n1) + move_relative(n2) + '+' + move_relative(-n2) + '-]';
}

function move_increment(target) {
  const n = parseInt(target);
  return '[' + move_relative(n) + '+' + move_relative(-n) + '-]';
}

function move_increment_relative(source, target) {
  const ns = parseInt(source);
  return move_relative(source) + move_increment(target) + move_relative(-ns);
}

function copy(targetRelativeLocation, tempRelativeLocation) {
  const n = parseInt(targetRelativeLocation);
  const t = parseInt(tempRelativeLocation);
  return move_value(t) + move_relative(t) + move_value2(n - t, -t) + move_relative(-t);
}

/**
 * Copies a value from source to a target location
 * @param {number} sourceRelativeLocation Cell to be copied from
 * @param {number} targetRelativeLocation Target
 * @param {number} tempRelativeLocation 
 * @returns Brainfuck instruction
 */
function copy_relative(sourceRelativeLocation, targetRelativeLocation, tempRelativeLocation) {
  const s = parseInt(sourceRelativeLocation);
  const t = parseInt(targetRelativeLocation);
  const temp = parseInt(tempRelativeLocation);
  return move_relative(s) + copy(t - s, temp - s) + move_relative(-s);
}

/**
 * Add a number to current cell
 * @param {number} adress Address to number that should be added to current cell
 * @param {number} temp1 
 * @param {number} temp2 
 * @returns Brainfuck instruction
 */
function add(adress, temp1, temp2) {
  const n = parseInt(adress);
  const t1 = parseInt(temp1);
  const t2 = parseInt(temp2);
  return clear_relative(t1) + clear_relative(t2) + move_relative(n) + move_value2(t1 - n, t2 - n) + move_relative(t1 - n) + move_value(n - t1) + move_relative(t2 - t1) + move_increment(-t2) + move_relative(-t2);
}

/**
 * Add a number to current cell
 * @param {number} source Address to number that should be added to current cell
 * @param {number} target Address to cell that should be added to
 * @param {number} temp1 
 * @param {number} temp2 
 * @returns Brainfuck instruction
 */
function add_relative(source, target, temp1, temp2) {
  const s = parseInt(source);
  const t = parseInt(target);
  const t1 = parseInt(temp1);
  const t2 = parseInt(temp2);
  return move_relative(t) + add(s - t, t1 - t, t2 - t) + move_relative(-t);
}

/**
 * Checks if both values at adress1 and adress2 is nonzero and puts the result in current cell
 * @param {number} adress1 
 * @param {number} adress2 
 * @param {number} temp1
 * @param {number} temp2
 * @param {number} temp3
 * @returns Brainfuck instruction
 */
function and(adress1, adress2, temp1, temp2, temp3) {
  const a1 = parseInt(adress1);
  const a2 = parseInt(adress2);
  const t1 = parseInt(temp1);
  const t2 = parseInt(temp2);
  const t3 = parseInt(temp3);

  return clear_cell() + copy_relative(a1, t1, t2) + to_bool_relative(t1, t2) + add(t1, t2, t3) + copy_relative(a2, t1, t2) + to_bool_relative(t1, t2) + add(t1, t2, t3) + to_bool(t1);
}

/**
 * Checks if both values at adress1 and adress2 is nonzero and puts the result in current cell
 * @param {number} source1
 * @param {number} source2
 * @param {number} target
 * @param {number} temp1
 * @param {number} temp2
 * @param {number} temp3
 * @returns Brainfuck instruction
 */
function and_relative(source1, source2, target, temp1, temp2, temp3) {
  const s1 = parseInt(source1);
  const s2 = parseInt(source2);
  const t = parseInt(target);
  const t1 = parseInt(temp1);
  const t2 = parseInt(temp2);
  const t3 = parseInt(temp3);
  return move_relative(t) + and(s1-t, s2-t, t1-t, t2-t, t3-t) + move_relative(-t);
}

function print(count) {
  return '.>'.repeat(count - 1) + '.'
}

/**
 * Prints the current cell value as a digit. Current cell should have a value between 0 and 9.
 * @returns Brainfuck instruction
 */
function print_digit() {
  const C = 48;
  return increase(C) + '.' + decrease(C);
}

function read(count) {
  return ',>'.repeat(count - 1) + ','
}

function clear_cell() {
  return '[-]';
}

function clear_relative(target) {
  const n = parseInt(target);
  return move_relative(n) + clear_cell() + move_relative(-n);
}

function repeat_instruction(count, ...args) {
  const code = parseInstruction(args.join(' '));
  return code.repeat(count);
}

function glide(stopvalue, left = true, on_each_cell = '') {
  const n = Math.abs(parseInt(stopvalue));
  const isNegative = parseInt(stopvalue) < 0;
  function open(n) {
    return isNegative ? '+'.repeat(n) + '[' + '-'.repeat(n) : '-'.repeat(n) + '[' + '+'.repeat(n)
  };
  const close = (n) => open(n).replace('[', ']');
  return on_each_cell + open(n) + (left ? '<' : '>') + on_each_cell + close(n);
}

function glide_left(stopvalue) {
  return glide(stopvalue, left = true);
}

function glide_right(stopvalue) {
  return glide(stopvalue, left = false);
}

function glide_left_do(stopvalue, ...args) {
  const code = parseInstruction(args.join(' '));
  return glide(stopvalue, left = true, on_each_cell = code);
}

function glide_right_do(stopvalue, ...args) {
  const code = parseInstruction(args.join(' '));
  return glide(stopvalue, left = false, on_each_cell = code);
}

const INSTRUCTIONS = new RegExp([
  /INCREASE \d+/,
  /DECREASE \d+/,
  /MOVE -?\d+/,
  /MOVE_RIGHT \d+/,
  /MOVE_LEFT \d+/,
  /MOVE_VALUE -?\d+/,
  /COPY -?\d+ -?\d+/,
  /COPY_RELATIVE -?\d+ -?\d+ -?\d+/,
  /CLEAR/,
  /PRINT \d+/,
  /PRINT_DIGIT/,
  /READ \d+/,
  // /IF -?\d+ .*/,
  /TO_BOOL -?\d+/,
  /NEGATE -?\d+/,
  /ADD -?\d+ -?\d+ -?\d+/,
  /ADD_RELATIVE -?\d+ -?\d+ -?\d+ -?\d+/,
  /AND -?\d+ -?\d+ -?\d+ -?\d+ -?\d+/,
  /AND_RELATIVE -?\d+ -?\d+ -?\d+ -?\d+ -?\d+ -?\d+/,
  /SET_VALUE -?\d+/,
  /SET_CHAR [.\s\S]/,
  /SET_STRING [.\s\S]+/,
  /REPEAT \d+ .*/,
  /GLIDE_LEFT -?\d+/,
  /GLIDE_RIGHT -?\d+/,
  /GLIDE_LEFT_DO -?\d+ .*/,
  /GLIDE_RIGHT_DO -?\d+ .*/,
].map(pattern => `(${pattern.source})`).join('|'))

const INSTRUCTIONS_MAP = {
  'INCREASE': increase,
  'DECREASE': decrease,
  'MOVE': move_relative,
  'MOVE_RIGHT': move_right,
  'MOVE_LEFT': move_left,
  'MOVE_VALUE': move_value,
  'COPY': copy,
  'COPY_RELATIVE': copy_relative,
  'CLEAR': clear_cell,
  'PRINT': print,
  'PRINT_DIGIT': print_digit,
  'READ': read,
  // "IF": if_do,
  'TO_BOOL': to_bool,
  'NEGATE': negate,
  'ADD': add,
  'ADD_RELATIVE': add_relative,
  'AND': and,
  'AND_RELATIVE': and_relative,
  'SET_VALUE': set_value,
  'SET_CHAR': set_char,
  'SET_STRING': set_string,
  'REPEAT': repeat_instruction,
  'GLIDE_LEFT': glide_left,
  'GLIDE_RIGHT': glide_right,
  'GLIDE_LEFT_DO': glide_left_do,
  'GLIDE_RIGHT_DO': glide_right_do,
}

// console.log('INSTRUCTIONS:', INSTRUCTIONS)

function trimNewLineCharacters(string) {
  return string.replace(/^\n+|\n+$|^\r+|\r+$/g, '')
}

function optimize(code) {
  let previous = "";
  let current = "" + code;

  do {
    previous = current;
    current = current.replace("><", "");
    current = current.replace("<>", "");
    current = current.replace("+-", "");
    current = current.replace("-+", "");
    current = current.replace("[-][-]", "[-]");
  } while (previous.length != current.length);

  return current;
}

function minify(code) {
  return code.replace(/[^\[\]\<\>\,\.\+\-]/g, "");
}

function parseInstruction(instruction) {
  const match = instruction.match(INSTRUCTIONS);
  if (!match) throw new Error(`${instruction} is not a valid instruction`);

  const [id, ...args] = match[0].split(' ');
  const code = INSTRUCTIONS_MAP[id](...args);
  return code;
}

fs.readFile(file, 'utf8', (err, data) => {
  if (err) {
    console.error(err)
    return
  }

  const instructions = data.split(/\n/).map(trimNewLineCharacters).filter(r => r != '');

  const new_data = instructions.map(parseInstruction);
  let code = new_data.join('\r\n');
  code = optimize(code);
  // code = minify(code);

  fs.writeFile(file.slice(0, -1), code, () => { });
});

