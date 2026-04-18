import { Theme } from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { FC, PropsWithChildren, useEffect } from "react";
import { QueryKeys } from "./query-keys";
import { mainApi } from "./renderer/api";

const getStoredDarkPreference = () => {
  try {
    return localStorage.getItem("dark") === "true";
  } catch {
    return false;
  }
};

export const ThemeProvider: FC<PropsWithChildren> = ({ children }) => {
  const { data: dark } = useQuery({
    queryKey: [QueryKeys.Theme],
    queryFn: async () => (await mainApi.getSettings()).ui.dark,
  });

  const isDark = dark ?? getStoredDarkPreference();

  useEffect(() => {
    document.documentElement.dataset.appearance = isDark ? "dark" : "light";
  }, [isDark]);

  useEffect(() => {
    if (dark === undefined) {
      return;
    }

    try {
      localStorage.setItem("dark", dark ? "true" : "false");
    } catch {
      // Ignore localStorage access failures.
    }
  }, [dark]);

  return (
    <Theme
      hasBackground={false}
      appearance={isDark ? "dark" : "light"}
      accentColor="violet"
    >
      {children}
    </Theme>
  );
};
