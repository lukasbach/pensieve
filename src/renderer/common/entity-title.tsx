import { FC, PropsWithChildren, ReactNode } from "react";
import { Box, Flex, Text } from "@radix-ui/themes";

export const EntityTitle: FC<
  PropsWithChildren<{ subtitle?: string; icon?: ReactNode; tags?: ReactNode }>
> = ({ subtitle, tags, icon, children }) => {
  return (
    <Flex align="center" gap=".5rem" maxWidth="100%" overflow="hidden">
      {icon && <Box>{icon}</Box>}
      <Flex direction="column" maxWidth="100%" overflow="hidden">
        <Flex
          mb="-.2rem"
          gap=".2rem"
          overflow="hidden"
          minWidth="0"
          maxWidth="100%"
        >
          <Text
            as="div"
            weight="bold"
            mb="-.2rem"
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              overflowWrap: "break-word",
              minWidth: 0,
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
