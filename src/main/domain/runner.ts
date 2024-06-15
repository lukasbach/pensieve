import { ExecaChildProcess, Options, execa } from "execa";
import log from "electron-log/main";

const processes = new Set<ExecaChildProcess<any>>();

export const abortAllExecutions = () => {
  for (const process of processes) {
    process.cancel();
  }
};

export const execute = (
  file: string,
  args?: readonly string[],
  options?: Options,
): ExecaChildProcess => {
  log.info(`Running execa on ${file}, with args: [${args?.join(",")}]`);
  const process = execa(file, args, options);
  processes.add(process);
  return process;
};
