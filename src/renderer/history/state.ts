import { useQuery } from "@tanstack/react-query";
import { mainApi } from "../api";

export const useHistoryRecordings = () => {
  return useQuery({
    queryKey: ["history"],
    queryFn: mainApi.getRecordings,
  });
};
