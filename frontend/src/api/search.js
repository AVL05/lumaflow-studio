import { apiClient } from "./client";

export const searchApi = {
  query: (term, { signal, groups, perGroup } = {}) =>
    apiClient
      .get("/search", {
        signal,
        params: {
          q: term,
          groups: groups?.length ? groups.join(",") : undefined,
          per_group: perGroup,
        },
      })
      .then((res) => res.data),
};
