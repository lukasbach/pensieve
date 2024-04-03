import { useDebouncedState } from "@react-hookz/web";
import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { QueryKeys } from "../../query-keys";
import { historyApi } from "../api";
import { RecordingMeta } from "../../types";

export const useSearch = () => {
  const [search, setSearch] = useDebouncedState("", 500, 1000);

  const { data } = useQuery({
    queryKey: [QueryKeys.History, search],
    queryFn: async () =>
      search
        ? historyApi.search(search)
        : ({} as ReturnType<typeof historyApi.search>),
  });

  const filter = useCallback(
    ([id]: [string, RecordingMeta]) => !search || !data || data[id],
    [data, search],
  );

  return {
    setSearch,
    searchResults: data,
    filter,
  };
};
