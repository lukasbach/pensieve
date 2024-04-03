import { FC, PropsWithChildren, ReactNode } from "react";
import { Box, Flex } from "@radix-ui/themes";
import {
  VscChromeClose,
  VscChromeMinimize,
  VscChromeRestore,
} from "react-icons/vsc";
import * as styles from "./page-container.module.css";
import { mainApi } from "../api";

export const PageContainer: FC<
  PropsWithChildren<{
    title?: string | ReactNode;
    headerContent?: ReactNode;
    tabs?: ReactNode;
    statusButtons?: ReactNode;
    icon?: ReactNode;
  }>
> = ({ tabs, title, icon, children, headerContent, statusButtons }) => {
  return (
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        <Box
          position="absolute"
          top="0"
          right="0"
          bottom="0"
          maxHeight="50px"
          className={styles.cannotDrag}
        >
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
        {(title || headerContent) && (
          <Box>
            <h1 className={styles.title}>
              <Flex align="center" gap=".5rem">
                {icon} {title}
              </Flex>
            </h1>
            <Box className={styles.content}>{headerContent}</Box>
          </Box>
        )}
        {tabs || statusButtons ? (
          <Flex display="inline-flex" align="center" width="calc(100% - 120px)">
            <div className={styles.cannotDrag}>{tabs}</div>
            <Box flexGrow="1" />
            <div className={styles.cannotDrag}>{statusButtons}</div>
          </Flex>
        ) : null}
      </div>
      <div className={styles.page}>{children}</div>
    </div>
  );
};
