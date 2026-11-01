// Every language OctoCode supports, in one place.
// "browser" languages run in a Web Worker; "server" languages are compiled by the runner container.
export type Language = {
  id: string; // stored on the room, sent to the server
  label: string;
  monaco: string; // Monaco's syntax-highlighting id
  runsIn: "browser" | "server";
  file: string; // file name shown on the editor tab
  color: string; // dot color on tabs and project cards
  starter: string; // inserted once when the room is created
};

export const LANGUAGES: Language[] = [
  {
    id: "python",
    label: "Python",
    monaco: "python",
    runsIn: "browser",
    file: "main.py",
    color: "#3b82f6",
    starter: 'def greet(name):\n    return f"Hello, {name}!"\n\nprint(greet("OctoCode"))\n',
  },
  {
    id: "javascript",
    label: "JavaScript",
    monaco: "javascript",
    runsIn: "browser",
    file: "main.js",
    color: "#eab308",
    starter: 'function greet(name) {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greet("OctoCode"));\n',
  },
  {
    id: "java",
    label: "Java",
    monaco: "java",
    runsIn: "server",
    file: "Main.java",
    color: "#f97316",
    starter:
      'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, OctoCode!");\n    }\n}\n',
  },
  {
    id: "cpp",
    label: "C++",
    monaco: "cpp",
    runsIn: "server",
    file: "main.cpp",
    color: "#ec4899",
    starter: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, OctoCode!" << std::endl;\n    return 0;\n}\n',
  },
  {
    id: "c",
    label: "C",
    monaco: "c",
    runsIn: "server",
    file: "main.c",
    color: "#14b8a6",
    starter: '#include <stdio.h>\n\nint main(void) {\n    printf("Hello, OctoCode!\\n");\n    return 0;\n}\n',
  },
];

export const getLanguage = (id: string) => LANGUAGES.find((l) => l.id === id) ?? LANGUAGES[0];
