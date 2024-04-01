import { FC } from "react";
import { useQuery } from "@tanstack/react-query";
import { historyDetailsRoute } from "../router/router";
import { QueryKeys } from "../../query-keys";
import { historyApi } from "../api";
import { PageContainer } from "../common/page-container";
import { Transscript } from "./transscript";

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
    <PageContainer title={recording?.name ?? "Untitled Recording"}>
      {transcript && <Transscript transcript={transcript} />}
    </PageContainer>
  );
};
