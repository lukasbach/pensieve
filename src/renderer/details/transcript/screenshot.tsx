import { FC, useState } from "react";
import * as styles from "./styles.module.css";

export const Screenshot: FC<{ url: string }> = ({ url }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  return (
    <div>
      <img
        src={url}
        alt="Screenshot thumbnail"
        className={[
          styles.screenshotThumbnail,
          isFullscreen && styles.screenshotThumbnailFullscreen,
        ].join(" ")}
        onClick={() => {
          if (isFullscreen) {
            document.body.classList.remove("screenshot-fullscreen");
          } else {
            document.body.classList.add("screenshot-fullscreen");
          }
          setIsFullscreen(!isFullscreen);
        }}
      />
    </div>
  );
};
