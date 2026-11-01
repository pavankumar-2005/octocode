// Every language OctoCode supports, in one place.
// "browser" languages run in a Web Worker; "server" languages are compiled by the runner container.
export type Language = {
  id: string; // stored on the room, sent to the server
  label: string;
  monaco: string; // Monaco's syntax-highlighting id
  runsIn: "browser" | "server";
  starter: string; // inserted once when the room is created
};

export const LANGUAGES: Language[] = [
  {
    id: "python",
    label: "Python",
    monaco: "python",
    runsIn: "browser",
    starter: 'def greet(name):\n    return f"Hello, {name}!"\n\nprint(greet("OctoCode"))\n',
  },
  {
    id: "javascript",
    label: "JavaScript",
    monaco: "javascript",
    runsIn: "browser",
    starter: 'function greet(name) {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greet("OctoCode"));\n',
  },
  {
    id: "java",
    label: "Java",
    monaco: "java",
    runsIn: "server",
    starter:
      'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, OctoCode!");\n    }\n}\n',
  },
  {
    id: "cpp",
    label: "C++",
    monaco: "cpp",
    runsIn: "server",
    starter: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, OctoCode!" << std::endl;\n    return 0;\n}\n',
  },
  {
    id: "c",
    label: "C",
    monaco: "c",
    runsIn: "server",
    starter: '#include <stdio.h>\n\nint main(void) {\n    printf("Hello, OctoCode!\\n");\n    return 0;\n}\n',
  },
];

export const getLanguage = (id: string) => LANGUAGES.find((l) => l.id === id) ?? LANGUAGES[0];
