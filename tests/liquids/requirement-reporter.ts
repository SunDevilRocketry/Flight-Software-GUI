import fs from "node:fs";
import path from "node:path";

const requirementPattern = /(?:RQ|FC)\.NLFS\.(?:[A-Z]+\.)?\d+/g;
const outputPath = path.resolve(process.cwd(), "test-results", "requirements-summary.md");

type TestTask = {
  type?: string;
  name: string;
  mode?: string;
  result?: { state?: string };
  tasks?: TestTask[];
};

function collectTests(task: TestTask, parentNames: string[] = []): TestTask[] {
  if (task.type === "test") {
    return [task];
  }

  return (task.tasks ?? []).flatMap((child) => collectTests(child, [...parentNames, task.name]));
}

function statusFor(test: TestTask): string {
  if (test.mode === "skip" || test.mode === "todo" || test.result?.state === "skip") {
    return "SKIP";
  }

  return test.result?.state === "pass" ? "PASS" : "FAIL";
}

function escapeCell(value: string): string {
  return value.replaceAll("|", "\\|").replaceAll("\n", " ");
}

function getRequirementIds(testName: string): string[] {
  return [...new Set(testName.match(requirementPattern) ?? [])];
}

function getTestCaseName(testName: string): string {
  const separatorIndex = testName.indexOf(":");
  const prefix = separatorIndex === -1 ? "" : testName.slice(0, separatorIndex);

  return separatorIndex !== -1 && getRequirementIds(prefix).length
    ? testName.slice(separatorIndex + 1).trim()
    : testName;
}

export default class RequirementReporter {
  onFinished(files: TestTask[]) {
    const tests = files.flatMap((file) => collectTests(file));
    const rows = tests.map((test) => {
      const requirements = getRequirementIds(test.name);
      return `| ${escapeCell(getTestCaseName(test.name))} | ${requirements.join(", ") || "Unmapped"} | ${statusFor(test)} |`;
    });

    const markdown = [
      "# Liquids Dashboard Requirement Test Summary",
      "",
      `Generated: ${new Date().toISOString()}`,
      "",
      "| Test case | Requirements | Status |",
      "| --- | --- | --- |",
      ...rows,
      "",
    ].join("\n");

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, markdown, "utf8");
  }
}
