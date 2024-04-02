import { FC, PropsWithChildren, ReactNode } from "react";
import { Box, Card, Flex, Separator } from "@radix-ui/themes";

export const ProgressCardWrapper: FC<
  PropsWithChildren<{ icon: ReactNode; header: ReactNode; actions?: ReactNode }>
> = ({ actions, header, icon, children }) => (
  <Card>
    <Box width="30rem">
      <Flex align="center" mb={children ? "1rem" : undefined}>
        <Flex mr="1rem" align="center">
          {icon}
        </Flex>
        <Box flexGrow="1">{header}</Box>
        <Box>{actions}</Box>
      </Flex>
      {children && (
        <>
          <Separator size="4" my="1rem" />
          {children}
        </>
      )}
    </Box>
  </Card>
);
