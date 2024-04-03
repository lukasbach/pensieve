import { FC, PropsWithChildren, ReactNode } from "react";
import { Box, Flex, FlexProps, Text } from "@radix-ui/themes";

export const EntityTitle: FC<
  PropsWithChildren<
    { subtitle?: string; icon?: ReactNode; tags?: ReactNode } & FlexProps
  >
> = ({ subtitle, tags, icon, children, ...props }) => {
  return (
    <Flex align="center" gap=".5rem" {...props}>
      {icon && <Box>{icon}</Box>}
      <Flex direction="column" overflow="hidden">
        <Flex mb="-.2rem" gap=".2rem">
          <Text
            as="div"
            weight="bold"
            mb="-.2rem"
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              overflowWrap: "break-word",
              whiteSpace: "nowrap",
            }}
          >
            {children}
          </Text>
          {tags && (
            <Box display="inline-block" ml=".2rem">
              {tags}
            </Box>
          )}
        </Flex>
        {subtitle && <Text>{subtitle}</Text>}
      </Flex>
    </Flex>
  );
};
