const fs = require('fs');
const { argv } = require('process');

const file = argv[2];

function increase(count) {
  return '+'.repeat(count);
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

function move_value(relativeLocation) {
  const n = parseInt(relativeLocation);
  const clear_target = move_relative(n) + clear_cell() + move_relative(-n);
  return clear_target + '[' + move_relative(n) + '+' + move_relative(-n) + '-]';
}

function move_value2(relativeLocation1, relativeLocation2) {
  const n1 = parseInt(relativeLocation1);
  const n2 = parseInt(relativeLocation2);
  const cl1 = move_relative(n1) + clear_cell() + move_relative(-n1);
  const cl2 = move_relative(n2) + clear_cell() + move_relative(-n2);
  return cl1 + cl2 + '[' + move_relative(n1) + '+' + move_relative(-n1) + move_relative(n2) + '+' + move_relative(-n2) + '-]';
}

function copy(targetRelativeLocation, tempRelativeLocation) {
  const n = parseInt(targetRelativeLocation);
  const t = parseInt(tempRelativeLocation);
  return move_value(t) + move_relative(t) + move_value2(n-t, -t) + move_relative(-t);
}

function print(count) {
  return '.>'.repeat(count - 1) + '.'
}

function read(count) {
  return ','.repeat(count)
}

function clear_cell() {
  return '[-]';
}

function glide(stopvalue, left = true, on_each_cell = '') {
  const n = Math.abs(parseInt(stopvalue));
  const isNegative = parseInt(stopvalue) < 0;
  function open(n) {
    return isNegative ? '+'.repeat(n) + '[' + '-'.repeat(n) : '-'.repeat(n) + '[' + '+'.repeat(n)
  };
  const close = (n) => open(n).replace('[', ']');
  return open(n) + (left ? '<' : '>') + on_each_cell + close(n);
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
  /MOVE_RIGHT \d+/,
  /MOVE_LEFT \d+/,
  /MOVE_VALUE -?\d+/,
  /COPY -?\d+ -?\d+/,
  /CLEAR/,
  /PRINT \d+/,
  /READ \d+/,
  /SET_VALUE -?\d+/,
  /SET_CHAR [.\s\S]/,
  /SET_STRING [.\s\S]+/,
  /GLIDE_LEFT -?\d+/,
  /GLIDE_RIGHT -?\d+/,
  /GLIDE_LEFT_DO -?\d+ .*/,
  /GLIDE_RIGHT_DO -?\d+ .*/,
].map(pattern => `(${pattern.source})`).join('|'))

const INSTRUCTIONS_MAP = {
  'INCREASE': increase,
  'DECREASE': decrease,
  'MOVE_RIGHT': move_right,
  'MOVE_LEFT': move_left,
  'MOVE_VALUE': move_value,
  'COPY': copy,
  'CLEAR': clear_cell,
  'PRINT': print,
  'READ': read,
  'SET_VALUE': set_value,
  'SET_CHAR': set_char,
  'SET_STRING': set_string,
  'GLIDE_LEFT': glide_left,
  'GLIDE_RIGHT': glide_right,
  'GLIDE_LEFT_DO': glide_left_do,
  'GLIDE_RIGHT_DO': glide_right_do,
}

// console.log('INSTRUCTIONS:', INSTRUCTIONS)

function trimNewLineCharacters(string) {
  return string.replace(/^\n+|\n+$|^\r+|\r+$/g, '')
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

  const instructions = data.split('\n').map(trimNewLineCharacters).filter(r => r != '');

  let new_data = []
  instructions.forEach(instruction => {
    const code = parseInstruction(instruction);
    new_data.push(code);
    // console.log(instruction, '=>', code);
  });

  fs.writeFile(file.slice(0, -1), new_data.join('\r\n'), () => { });
});

