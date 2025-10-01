// Removed legacy mock hook. Keeping stub to satisfy stray imports until cleanup.
export function useHomeDataMock() {
    return { data: undefined, isLoading: false } as const;
}
