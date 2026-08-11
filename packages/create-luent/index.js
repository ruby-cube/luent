#!/usr/bin/env node
import prompts from "prompts";
import fs from "fs-extra";
import path from "path";
import { execSync } from "child_process";

const cwd = process.cwd();

function getProjectName() {
  const cwd = process.cwd();
  let name = process.argv[2]
  if (name) return { name };
  return prompts({
    type: "text",
    name: "name",
    message: "Project name:",
    initial: "luent-app"
  });
}

async function main() {
  const { name } = await getProjectName();

  const targetDir = path.join(cwd, name);

  await fs.copy(
    path.join(import.meta.dirname, "./templates/basic"),
    targetDir
  );

  // update package.json name
  const pkgPath = path.join(targetDir, "package.json");
  const pkg = await fs.readJson(pkgPath);
  pkg.name = name;
  await fs.writeJson(pkgPath, pkg, { spaces: 2 });

  console.log(`
Created!

Next steps:
  cd ${name}
  npm install
  npm run dev --open
`);
}

main();