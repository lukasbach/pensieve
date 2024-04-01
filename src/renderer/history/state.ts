import { useQuery } from "@tanstack/react-query";
import { historyApi } from "../api";
import { QueryKeys } from "../../query-keys";

export const useHistoryRecordings = () => {
  return useQuery({
    queryKey: [QueryKeys.History],
    queryFn: historyApi.getRecordings,
  });
};
