import { FC, PropsWithChildren, ReactNode } from "react";
import { Box, Flex, Text } from "@radix-ui/themes";

export const SettingsField: FC<
  PropsWithChildren<{
    label?: string | ReactNode;
    description?: string;
    textTop?: string;
  }>
> = ({ label, description, children, textTop }) => {
  return (
    <Flex gap="1.5rem" align="start" mt="1.2rem" asChild>
      <label>
        <Box width="10rem" minWidth="10rem" pt={textTop}>
          {label ?? ""}
        </Box>
        <Box flexGrow="1">
          {children}
          {description && (
            <Text color="gray" mt="2px">
              {description}
            </Text>
          )}
        </Box>
      </label>
    </Flex>
  );
};
