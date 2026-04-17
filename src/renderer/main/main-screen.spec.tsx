import { PropsWithChildren, ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import { Tabs, Theme } from "@radix-ui/themes";
import { QueryKeys } from "../../query-keys";
import { MainScreen } from "./main-screen";

const { getPostProcessingProgressMock, openSettingsWindowMock } = vi.hoisted(
  () => ({
    getPostProcessingProgressMock: vi.fn(),
    openSettingsWindowMock: vi.fn(),
  }),
);

vi.mock("../api", () => ({
  historyApi: {
    getPostProcessingProgress: getPostProcessingProgressMock,
  },
  windowsApi: {
    openSettingsWindow: openSettingsWindowMock,
  },
}));

vi.mock("../history/history", () => ({
  History: () => <div>History content</div>,
}));

vi.mock("../recorder/recorder", () => ({
  Recorder: () => <div>Recorder content</div>,
}));

vi.mock("../chat/chat", () => ({
  Chat: () => <div>Chat content</div>,
}));

vi.mock("../postprocess/postprocess", () => ({
  Postprocess: () => <div>Postprocess content</div>,
}));

vi.mock("../common/fancybg", () => ({
  Fancybg: () => null,
}));

vi.mock("../common/page-container", () => ({
  PageContainer: ({
    children,
    statusButtons,
    tabs,
  }: PropsWithChildren<{
    statusButtons?: ReactNode;
    tabs?: ReactNode;
  }>) => (
    <div>
      <div>{tabs}</div>
      <div>{statusButtons}</div>
      <div>{children}</div>
    </div>
  ),
}));

vi.mock("../common/responsive-tab-trigger", () => ({
  ResponsiveTabTrigger: ({
    children,
    value,
  }: PropsWithChildren<{ value: string }>) => (
    <Tabs.Trigger value={value}>{children}</Tabs.Trigger>
  ),
}));

const createPostProcessingProgress = (
  processingQueue: { recordingId: string }[],
) => ({
  currentStep: "notstarted",
  isRunning: false,
  processingQueue,
  progress: {},
});

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const renderMainScreen = (queryClient: QueryClient) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <Theme hasBackground={false} appearance="light">
        <MainScreen />
      </Theme>
    </QueryClientProvider>,
  );
};

describe("MainScreen", () => {
  let progressData = createPostProcessingProgress([]);

  beforeEach(() => {
    getPostProcessingProgressMock.mockReset();
    openSettingsWindowMock.mockReset();
    progressData = createPostProcessingProgress([]);
    getPostProcessingProgressMock.mockImplementation(async () => progressData);
  });

  it("does not render the postprocessing tab when the queue is empty", async () => {
    const queryClient = createQueryClient();

    renderMainScreen(queryClient);

    await waitFor(() => {
      expect(getPostProcessingProgressMock).toHaveBeenCalledTimes(1);
    });

    expect(
      screen.queryByRole("tab", { name: /Postprocessing/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Record/ })).toBeInTheDocument();
  });

  it("removes the postprocessing tab when the queue is cleared", async () => {
    progressData = createPostProcessingProgress([
      { recordingId: "recording-1" },
    ]);
    const queryClient = createQueryClient();

    renderMainScreen(queryClient);

    expect(
      await screen.findByRole("tab", { name: /Postprocessing/ }),
    ).toBeInTheDocument();

    progressData = createPostProcessingProgress([]);

    await act(async () => {
      await queryClient.invalidateQueries({
        queryKey: [QueryKeys.PostProcessing],
      });
    });

    await waitFor(() => {
      expect(
        screen.queryByRole("tab", { name: /Postprocessing/ }),
      ).not.toBeInTheDocument();
    });

    expect(screen.getByText("Recorder content")).toBeInTheDocument();
  });
});
