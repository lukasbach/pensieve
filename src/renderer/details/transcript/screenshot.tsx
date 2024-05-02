/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */
import { FC, useState } from "react";
import { Portal } from "@radix-ui/themes";
import * as styles from "./styles.module.css";

export const Screenshot: FC<{ url: string }> = ({ url }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  return (
    <>
      <div>
        <img
          src={url}
          alt="Screenshot thumbnail"
          className={styles.screenshotThumbnail}
          onClick={() => setIsFullscreen(!isFullscreen)}
        />
      </div>
      {isFullscreen && (
        <Portal>
          {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
          <div
            className={styles.screenshotThumbnailFullscreenContainer}
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            <img
              src={url}
              alt="Screenshot thumbnail"
              className={styles.screenshotThumbnailFullscreen}
            />
          </div>
        </Portal>
      )}
    </>
  );
};
