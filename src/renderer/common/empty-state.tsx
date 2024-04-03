import { FC, PropsWithChildren, ReactNode } from "react";
import { Box, Flex, Heading, Text } from "@radix-ui/themes";

export const EmptyState: FC<
  PropsWithChildren<{ title?: string; description?: string; icon?: ReactNode }>
> = ({ description, title, icon, children }) => {
  return (
    <Flex
      maxWidth="32rem"
      mx="auto"
      py="1rem"
      px="1rem"
      direction="column"
      gap=".2rem"
      height="100%"
      justify="center"
      align="center"
      style={{ textAlign: "center" }}
    >
      {icon && <Box mb=".2rem">{icon}</Box>}
      <Heading>{title}</Heading>
      <Text>{description}</Text>
      {children}
    </Flex>
  );
};
