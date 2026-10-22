export const getItemHref = (item, dbType) => {
    if (item.media_type !== "movie" && item.media_type !== "tv") return null;
    return dbType === "mongo"
        ? `/user/${item.media_type}/${item._id}`
        : `/${item.media_type}/${item.id}`;
};
