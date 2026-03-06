export const isAuthorizedDev = (userId: string | null | undefined): boolean => {
    // Array of authorized developer Discord IDs
    const DEVS = ["1449081308616720628"];
    return !!userId && DEVS.includes(userId);
};
