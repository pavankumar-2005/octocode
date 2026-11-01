import { Card, CardBody, CardHeader, Spinner } from "@heroui/react";
import type { RunResult } from "../lib/runCode";

type Props = { result: RunResult | null; running: boolean };

export default function OutputPanel({ result, running }: Props) {
  return (
    <Card className="h-full" radius="sm">
      <CardHeader className="justify-between py-2 text-sm font-medium">
        Output
        {running && <Spinner size="sm" />}
      </CardHeader>
      <CardBody className="pt-0">
        {!result && !running && <p className="text-sm text-default-400">Press Run to execute the code.</p>}
        {result && (
          <pre className={`whitespace-pre-wrap font-mono text-xs ${result.ok ? "" : "text-danger"}`}>
            {result.output || "(no output)"}
          </pre>
        )}
      </CardBody>
    </Card>
  );
}
