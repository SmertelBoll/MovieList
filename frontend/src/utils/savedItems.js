import instance from '../axios';

// Full data of a saved copy (rating, comment, date, tag, folderName). The saved index only knows where a copy lives, so
// editing fetches the rest here.
export const fetchSavedDoc = async (mediaType, mongoId) => {
    const res = await instance.get(`/${mediaType}/mongo/${mongoId}`);
    return res.data.results;
};
