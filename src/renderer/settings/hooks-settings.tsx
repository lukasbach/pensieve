import { FC } from "react";
import { useFormContext } from "react-hook-form";
import * as Tabs from "@radix-ui/react-tabs";
import { Settings } from "../../types";
import { EmptyState } from "../common/empty-state";

export const HooksSettings: FC = () => {
  const form = useFormContext<Settings>();
  return (
    <Tabs.Content value="hooks">
      <EmptyState>Coming soon!</EmptyState>
    </Tabs.Content>
  );
};
