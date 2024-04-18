import { FC, PropsWithChildren, ReactNode } from "react";
import { Box, Flex, IconButton } from "@radix-ui/themes";
import {
  VscChromeClose,
  VscChromeMinimize,
  VscChromeRestore,
} from "react-icons/vsc";
import { HiMiniArrowTopRightOnSquare } from "react-icons/hi2";
import * as styles from "./page-container.module.css";
import { mainApi } from "../api";
import { useIsTray } from "./use-is-tray";

const AppControls = () => {
  return (
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
        onClick={() => mainApi.closeCurrentWindow()}
      >
        <VscChromeClose />
      </button>
    </Box>
  );
};

export const PageContainer: FC<
  PropsWithChildren<{
    title?: string | ReactNode;
    headerContent?: ReactNode;
    tabs?: ReactNode;
    statusButtons?: ReactNode;
    icon?: ReactNode;
  }>
> = ({ tabs, title, icon, children, headerContent, statusButtons }) => {
  const tray = useIsTray();
  const dragStyle = tray ? "" : styles.canDrag;
  const hasBoth = (tabs || statusButtons || tray) && (title || headerContent);
  return (
    <div className={styles.container}>
      <div className={`${styles.headerContainer} ${dragStyle}`}>
        {!tray && <AppControls />}
        {(title || headerContent) && (
          <Box mb={hasBoth ? "-.7rem" : undefined}>
            <h1 className={styles.title}>
              <Flex align="center" gap=".5rem">
                {icon} {title}
              </Flex>
            </h1>
            <Box className={styles.content}>{headerContent}</Box>
          </Box>
        )}
        {tabs || statusButtons || tray ? (
          <Flex
            display="inline-flex"
            align="center"
            width={`calc(100% - ${tray ? "8px" : "120px"})`}
          >
            <div className={styles.cannotDrag}>{tabs}</div>
            <Box flexGrow="1" />
            <Flex
              className={styles.cannotDrag}
              gap=".3rem"
              onClick={() => mainApi}
            >
              {statusButtons}
              {tray && (
                <IconButton
                  color="gray"
                  variant="outline"
                  onClick={() => mainApi.openMainWindowNormally()}
                >
                  <HiMiniArrowTopRightOnSquare />
                </IconButton>
              )}
            </Flex>
          </Flex>
        ) : null}
      </div>
      <div className={styles.page}>{children}</div>
    </div>
  );
};
