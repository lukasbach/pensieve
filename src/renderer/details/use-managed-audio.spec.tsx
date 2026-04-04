import { act, renderHook } from "@testing-library/react";
import { useManagedAudio } from "./use-managed-audio";

type MockAudioListener = (event: { currentTarget: HTMLAudioElement }) => void;

const createAudioTag = () => {
  const listeners = new Map<string, Set<MockAudioListener>>();

  const audio = {
    addEventListener: vi.fn((type: string, listener: MockAudioListener) => {
      if (!listeners.has(type)) {
        listeners.set(type, new Set());
      }
      listeners.get(type)!.add(listener);
    }),
    currentTime: 12,
    duration: 90,
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    pause: vi.fn(() => emit("pause")),
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    play: vi.fn(() => emit("play")),
    removeEventListener: vi.fn((type: string, listener: MockAudioListener) => {
      listeners.get(type)?.delete(listener);
    }),
  } as unknown as HTMLAudioElement;

  const emit = (type: string) => {
    listeners.get(type)?.forEach((listener) => {
      listener({ currentTarget: audio });
    });
  };

  return { audio, emit };
};

const transcript = {
  result: { language: "en" },
  transcription: [
    {
      timestamps: { from: "00:00:00.000", to: "00:00:10.000" },
      offsets: { from: 10, to: 20 },
      text: "Planning",
      speaker: "Alice",
    },
    {
      timestamps: { from: "00:00:10.000", to: "00:00:20.000" },
      offsets: { from: 40, to: 50 },
      text: "Actions",
      speaker: "Bob",
    },
  ],
};

describe("useManagedAudio", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("controls audio playback and keeps progress in sync", () => {
    const { result, rerender } = renderHook(() => useManagedAudio(transcript));
    const { audio, emit } = createAudioTag();

    (result.current.audioTag as { current: HTMLAudioElement | null }).current =
      audio;
    rerender();

    expect(result.current.duration).toBe(90);

    act(() => {
      emit("timeupdate");
    });

    expect(result.current.progress).toBe(12);

    act(() => {
      result.current.jumpForward();
    });

    expect(audio.currentTime).toBe(27);

    audio.currentTime = 3;

    act(() => {
      result.current.jumpBackward();
    });

    expect(audio.currentTime).toBe(0);

    act(() => {
      result.current.play();
    });

    expect(audio.play).toHaveBeenCalledTimes(1);
    expect(result.current.isPlaying).toBe(true);

    act(() => {
      result.current.pause();
    });

    expect(audio.pause).toHaveBeenCalledTimes(1);
    expect(result.current.isPlaying).toBe(false);
  });

  it("jumps to the nearest transcript item when scrolling", () => {
    const { result } = renderHook(() => useManagedAudio(transcript));
    const target = document.createElement("div");
    const scrollIntoViewMock = vi.fn();

    target.id = "transcript-item-40";
    target.scrollIntoView = scrollIntoViewMock;
    document.body.appendChild(target);

    act(() => {
      result.current.scrollTo(42);
    });

    expect(scrollIntoViewMock).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "center",
    });
  });

  it("can scroll directly to a transcript line", () => {
    const { result } = renderHook(() => useManagedAudio(transcript));
    const target = document.createElement("div");
    const scrollIntoViewMock = vi.fn();

    target.id = "transcript-item-40";
    target.scrollIntoView = scrollIntoViewMock;
    document.body.appendChild(target);

    act(() => {
      result.current.scrollToLine(1);
    });

    expect(scrollIntoViewMock).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "center",
    });
  });
});
