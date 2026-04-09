import api from "./api";

export const TagsService = {
  getAll(): Promise<string[]> {
    return api.get("/tags").then((r) => r.data.tags);
  },
};
