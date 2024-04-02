import { useForm } from "react-hook-form";
import { FieldPath } from "react-hook-form/dist/types/path";
import { useQuery } from "@tanstack/react-query";
import { Settings } from "../../types";
import { QueryKeys } from "../../query-keys";
import { mainApi } from "../api";

export const useSettingControl = (field: FieldPath<Settings>) => {
  const { data: values } = useQuery({
    queryKey: [QueryKeys.Settings],
    queryFn: mainApi.getSettings,
  });
  const form = useForm<Settings>({ values, mode: "onChange" });
  form.register("whisper.model");
};
