import { PropsWithChildren, forwardRef } from "react";
import { Flex } from "@radix-ui/themes";
import { FlexProps } from "@radix-ui/themes/src/components/flex";

export const PageContent = forwardRef<
  HTMLDivElement,
  PropsWithChildren<FlexProps>
>(({ children, ...props }, ref) => (
  <Flex
    maxWidth="32rem"
    mx="auto"
    my="1rem"
    px="1rem"
    direction="column"
    gap="1rem"
    flexGrow="1"
    height="-webkit-fill-available"
    ref={ref}
    {...props}
  >
    {children}
  </Flex>
));
