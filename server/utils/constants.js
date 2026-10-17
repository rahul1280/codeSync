const ROLES = {
  OWNER: 'owner',
  EDITOR: 'editor',
  VIEWER: 'viewer'
};

const SUPPORTED_LANGUAGES = [
  'javascript',
  'python',
  'typescript',
  'html',
  'css',
  'json',
  'markdown',
  'cpp',
  'java',
  'go',
  'rust'
];

const EXECUTABLE_LANGUAGES = ['javascript', 'python'];

const EXECUTION_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  TIMEOUT: 'timeout'
};

const AVATAR_COLORS = [
  '#F87171', '#FB923C', '#FBBF24', '#34D399',
  '#60A5FA', '#818CF8', '#A78BFA', '#F472B6'
];

module.exports = {
  ROLES,
  SUPPORTED_LANGUAGES,
  EXECUTABLE_LANGUAGES,
  EXECUTION_STATUS,
  AVATAR_COLORS
};
