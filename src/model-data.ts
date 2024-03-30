const defineModel = (name: string, size: string) => ({
  name,
  fileName: `${name}.bin`,
  isQuantized: name.includes("q5") || name.includes("q8"),
  url: `https://huggingface.co/ggerganov/whisper.cpp/resolve/main/${name}.bin?download=true`,
  size,
});

export const modelData = [
  defineModel("ggml-base-q5_1", "59.7MB"),
  defineModel("ggml-base.en-q5_1", "59.7MB"),
  defineModel("ggml-base.en", "148MB"),
  defineModel("ggml-large-v1", "3.09GB"),
  defineModel("ggml-large-v2-q5_0", "1.08GB"),
  defineModel("ggml-large-v2", "3.09GB"),
  defineModel("ggml-large-v3-q5_0", "1.08GB"),
  defineModel("ggml-large-v3", "3.1GB"),
  defineModel("ggml-medium-q5_0", "539MB"),
  defineModel("ggml-medium", "1.53GB"),
  defineModel("ggml-medium.en-q5_0", "539MB"),
  defineModel("ggml-medium.en", "1.53GB"),
  defineModel("ggml-small-q5_1", "190MB"),
  defineModel("ggml-small", "488MB"),
  defineModel("ggml-small.en-q5_1", "190MB"),
  defineModel("ggml-small.en", "488MB"),
  defineModel("ggml-tiny-q5_1", "32.2MB"),
  defineModel("ggml-tiny", "77.7MB"),
  defineModel("ggml-tiny.en-q5_1", "32.2MB"),
  defineModel("ggml-tiny.en-q8_0", "43.6MB"),
  defineModel("ggml-tiny.en", "77.7MB"),
].reduce(
  (acc, model) => {
    acc[model.name] = model;
    return acc;
  },
  {} as Record<string, ReturnType<typeof defineModel>>,
);
