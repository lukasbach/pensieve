import { FC } from "react";
import { Spinner } from "@radix-ui/themes";
import {
  HiOutlineArrowDownOnSquare,
  HiOutlineComputerDesktop,
  HiOutlineMicrophone,
  HiOutlinePhone,
  HiOutlineStar,
} from "react-icons/hi2";
import { RecordingMeta } from "../../types";

export const HistoryItemIcon: FC<{
  recording: RecordingMeta;
  isProcessing: boolean;
}> = ({ isProcessing, recording }) => {
  if (isProcessing) return <Spinner />;
  if (recording.isPinned) return <HiOutlineStar />;
  if (recording.isImported) return <HiOutlineArrowDownOnSquare />;
  if (recording.hasMic && recording.hasScreen) return <HiOutlinePhone />;
  if (recording.hasMic) return <HiOutlineMicrophone />;
  if (recording.hasScreen) return <HiOutlineComputerDesktop />;
  return <HiOutlinePhone />;
};
