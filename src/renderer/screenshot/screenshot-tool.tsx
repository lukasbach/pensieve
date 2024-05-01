import { FC, useRef, useState } from "react";
import { Box, Flex } from "@radix-ui/themes";
import { useKeyboardEvent } from "@react-hookz/web";
import { useSearch } from "@tanstack/react-router";
import { mainApi } from "../api";

export const ScreenshotTool: FC = () => {
  const { displayId } = useSearch({ from: "/screenshot" as const });
  const [start, setStart] = useState<{ x: number; y: number } | undefined>();
  const [clickMode, setClickMode] = useState(false);
  const [dragStartTime, setDragStartTime] = useState<number>(0);
  const box = useRef<HTMLDivElement>(null);

  useKeyboardEvent("Escape", () => {
    mainApi.abortScreenshotArea();
  });

  return (
    <Flex
      position="relative"
      align="center"
      justify="center"
      height="100%"
      style={{ cursor: "crosshair", userSelect: "none" }}
      onClick={(e) => {
        if (clickMode && start) {
          mainApi.completeScreenshotArea({
            displayId: displayId ?? "",
            ...start,
            width: e.clientX - start.x,
            height: e.clientY - start.y,
          });
          return;
        }
        setClickMode(true);
      }}
      onMouseDown={(e) => {
        setStart({ x: e.clientX, y: e.clientY });
        setDragStartTime(Date.now());
      }}
      onMouseMove={(e) => {
        if (start && box.current) {
          box.current.style.width = `${e.clientX - start.x}px`;
          box.current.style.height = `${e.clientY - start.y}px`;
        }
      }}
      onMouseUp={(e) => {
        if (Date.now() - dragStartTime > 200 && start) {
          mainApi.completeScreenshotArea({
            displayId: displayId ?? "",
            ...start,
            width: e.clientX - start.x,
            height: e.clientY - start.y,
          });
        }
      }}
    >
      Drag an area to take a screenshot
      {JSON.stringify(start)}
      {start && (
        <Box
          ref={box}
          position="absolute"
          top={`${start.y}px`}
          left={`${start.x}px`}
          style={{
            border: "1px solid #0f77ff",
          }}
        />
      )}
    </Flex>
  );
};
