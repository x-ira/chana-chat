export const defaultCommands = [
  {
    name: 'remark',
    desc: 'set a alias for this chat',
    scope: 2,
    parameters: [
      {
        name: 'alias',
        type: 'string',
        required: true,
        desc: 'Alias'
      }
    ]
  },
  {
    name: 'clear',
    desc: 'Clear Priv-Chat history',
    scope: 1,
    parameters: []
  },
  {
    name: 'leave',
    desc: 'Leave the current private chat',
    scope: 1,
    parameters: []
  },
  {
    name: 'help',
    desc: 'Command usages',
    scope: 2,
    parameters: []
  },
];

  // Create command suggestion item
export const createCmdSugg = (cmd) => ({
    type: 'command',
    val: cmd.name,
    desc: cmd.desc
  });

  // Get current parameter information
export const getCurrParamInfo = (input, inputParts) => {
    let currParamIdx;
    let currInputParam;
    
    if (input.endsWith(' ')) { // If input ends with space, it means entering the next parameter
      const nonEmptyParts = inputParts.filter(part => part.trim() !== '');
      currParamIdx = nonEmptyParts.length - 1; // Subtract the command itself
      currInputParam = '';
    } else { // If input doesn't end with space, it means currently entering a parameter
      const nonEmptyParts = inputParts.filter(part => part.trim() !== '');
      currParamIdx = Math.max(0, nonEmptyParts.length - 2); // Subtract the command itself
      currInputParam = inputParts[inputParts.length - 1] || '';
    }
    return { currParamIdx, currInputParam };
  };
  // Parse input content
export const parse_input = (input) => {
    if (!input.startsWith('/')) {  return { isCmd: false }; }
    const parts = input.slice(1).split(' ').filter(part => part.length > 0);
    if (parts.length === 0) {
      return { isCmd: true, cmdName: '', params: [] };
    }
    return { isCmd: true, cmdName: parts[0], params: parts.slice(1) };
  };
