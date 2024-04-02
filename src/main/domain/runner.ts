import { ExecaChildProcess, Options, execa } from "execa";

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
  const process = execa(file, args, options);
  processes.add(process);
  return process;
};
