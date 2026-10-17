export const SUPPORTED_LANGUAGES = [
  { id: 'javascript', name: 'JavaScript', extension: 'js', defaultCode: '// JavaScript Playground\nfunction greeting(name) {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greeting("CodeSync"));\n' },
  { id: 'python', name: 'Python', extension: 'py', defaultCode: '# Python Playground\ndef greeting(name):\n    return f"Hello, {name}!"\n\nprint(greeting("CodeSync"))\n' },
  { id: 'html', name: 'HTML', extension: 'html', defaultCode: '<!DOCTYPE html>\n<html>\n  <head>\n    <title>CodeSync</title>\n  </head>\n  <body>\n    <h1>Hello CodeSync</h1>\n  </body>\n</html>\n' },
  { id: 'css', name: 'CSS', extension: 'css', defaultCode: '/* CSS Stylesheet */\nbody {\n  font-family: sans-serif;\n  background-color: #0d1117;\n  color: #ffffff;\n}\n' },
  { id: 'json', name: 'JSON', extension: 'json', defaultCode: '{\n  "project": "CodeSync",\n  "status": "active"\n}\n' },
  { id: 'java', name: 'Java', extension: 'java', defaultCode: 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, CodeSync!");\n  }\n}\n' },
  { id: 'cpp', name: 'C++', extension: 'cpp', defaultCode: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, CodeSync!" << std::endl;\n    return 0;\n}\n' },
];

export const ROLE_LABELS = {
  owner: { label: 'Owner', badgeClass: 'badge-purple' },
  editor: { label: 'Editor', badgeClass: 'badge-primary' },
  viewer: { label: 'Viewer', badgeClass: 'badge-secondary' },
};

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
export const COLLAB_WS_URL = import.meta.env.VITE_COLLAB_WS_URL || 'ws://localhost:4444';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
