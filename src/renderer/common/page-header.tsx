import { FC, PropsWithChildren, ReactNode } from "react";
import { Box } from "@radix-ui/themes";
import {
  VscChromeClose,
  VscChromeMinimize,
  VscChromeRestore,
} from "react-icons/vsc";
import * as styles from "./page-header.module.css";
import { mainApi } from "../api";

export const PageHeader: FC<
  PropsWithChildren<{
    title?: string;
    tabs?: ReactNode;
  }>
> = ({ tabs, title, children }) => {
  return (
    <Box position="relative" className={styles.container}>
      <Box position="absolute" top="0" right="0" className={styles.cannotDrag}>
        <button
          className={styles.windowBtn}
          type="button"
          aria-label="Minimize"
          onClick={() => mainApi.minimizeWindow()}
        >
          <VscChromeMinimize />
        </button>
        <button
          className={styles.windowBtn}
          type="button"
          aria-label="Restore"
          onClick={() => mainApi.restoreMaximizeWindow()}
        >
          <VscChromeRestore />
        </button>
        <button
          className={`${styles.windowBtn} ${styles.windowCloseBtn}`}
          type="button"
          aria-label="Close"
          onClick={() => mainApi.closeWindow()}
        >
          <VscChromeClose />
        </button>
      </Box>
      {(title || children) && (
        <Box>
          <h1 className={styles.title}>{title}</h1>
          <Box className={styles.content}>{children}</Box>
        </Box>
      )}
      {tabs && (
        <Box className={styles.cannotDrag} display="inline-block">
          {tabs}
        </Box>
      )}
    </Box>
  );
};
