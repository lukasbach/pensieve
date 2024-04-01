import { FC } from "react";
import { useQuery } from "@tanstack/react-query";
import { historyDetailsRoute } from "../router/router";
import { QueryKeys } from "../../query-keys";
import { historyApi } from "../api";
import { PageHeader } from "../common/page-header";

export const DetailsScreen: FC = () => {
  const { id } = historyDetailsRoute.useParams();
  const { data: recording } = useQuery({
    queryKey: [QueryKeys.History, id],
    queryFn: () => historyApi.getRecordingMeta(id),
  });
  const { data: transcript } = useQuery({
    queryKey: [QueryKeys.Transcript, id],
    queryFn: () => historyApi.getRecordingTranscript(id),
  });

  return (
    <>
      <PageHeader title={recording?.name ?? "Untitled Recording"}>
        Blubxx
      </PageHeader>
      <pre>{JSON.stringify(recording)}</pre>
      <pre>{JSON.stringify(transcript)}</pre>
    </>
  );
};
