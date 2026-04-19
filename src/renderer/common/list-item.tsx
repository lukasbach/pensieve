import React, { FC, PropsWithChildren, ReactNode } from "react";
import { Box, Card, Flex } from "@radix-ui/themes";
import { Editable } from "./editable";
import { EntityTitle } from "./entity-title";

export const ListItem: FC<
  PropsWithChildren<{
    title: string;
    icon?: ReactNode;
    onRename?: (newValue: string) => void;
    subtitle?: ReactNode;
    tags?: ReactNode;
    forceHoverState?: boolean;
    id?: string;
    isHighlighted?: boolean;
    compact?: boolean;
  }>
> = ({
  id,
  onRename,
  subtitle,
  title,
  children,
  icon,
  tags,
  forceHoverState,
  isHighlighted,
  compact,
}) => {
  return (
    <Box pb={compact ? ".25rem" : ".5rem"} id={id}>
      <Card
        className="hoverhide-container"
        style={{
          ...(isHighlighted ? { background: "var(--accent-8)" } : {}),
          ...(compact ? { padding: "var(--space-2)" } : {}),
        }}
      >
        <Flex align="center" gap={compact ? ".35rem" : ".5rem"}>
          <Box flexGrow="1" maxWidth="100%" overflow="hidden">
            <Editable
              compact={compact}
              value={title}
              onChange={onRename as any}
              renderValue={({ value, editBtn }) => (
                <EntityTitle
                  subtitle={subtitle}
                  icon={
                    onRename ? (
                      <>
                        {editBtn}
                        <span className="hoverhide-inverseitem">{icon}</span>
                      </>
                    ) : (
                      icon
                    )
                  }
                  tags={tags}
                >
                  {value}
                </EntityTitle>
              )}
            />
          </Box>
          <Flex
            className={forceHoverState ? "" : "hoverhide-item"}
            gap={compact ? "6px" : "8px"}
          >
            {children}
          </Flex>
        </Flex>
      </Card>
    </Box>
  );
};
