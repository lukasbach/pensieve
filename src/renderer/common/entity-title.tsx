import { FC, PropsWithChildren, ReactNode } from "react";
import { Box, Flex, FlexProps, Text } from "@radix-ui/themes";

export const EntityTitle: FC<
  PropsWithChildren<
    { subtitle?: ReactNode; icon?: ReactNode; tags?: ReactNode } & FlexProps
  >
> = ({ subtitle, tags, icon, children, ...props }) => {
  return (
    <Flex align="center" gap=".5rem" {...props}>
      {icon && <Box>{icon}</Box>}
      <Flex direction="column" overflow="hidden">
        <Flex gap=".2rem">
          <Text
            as="div"
            weight="bold"
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
        {subtitle &&
          (typeof subtitle === "string" || typeof subtitle === "number" ? (
            <Text
              mt="-.4rem"
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                overflowWrap: "break-word",
                whiteSpace: "nowrap",
              }}
            >
              {subtitle}
            </Text>
          ) : (
            <Box mt="-.2rem" overflow="hidden">
              {subtitle}
            </Box>
          ))}
      </Flex>
    </Flex>
  );
};
