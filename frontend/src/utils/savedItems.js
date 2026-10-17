import instance from '../axios';

// Повні дані збереженої копії фільму/серіалу (оцінка, коментар, дата, тег, folderName).
// Індекс збережених (redux `saved`) тримає лише де лежить копія — решту тягнемо тут,
// коли відкриваємо редагування копії зі сторінки, де її поля ще не завантажені.
export const fetchSavedDoc = async (mediaType, mongoId) => {
    const res = await instance.get(`/${mediaType}/mongo/${mongoId}`);
    return res.data.results;
};
