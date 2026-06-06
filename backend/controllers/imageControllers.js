import cloudinary from "../utils/cloudinary.js";

// Видаляє файл з Cloudinary за його public_id. Помилки лише логуємо,
// щоб збій видалення картинки не ламав основну операцію.
export const destroyImage = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.log("Cloudinary destroy error:", error);
  }
};

export const uploadFile = async (req, res) => {
  try {
    const { image } = req.body;

    const options = {
      use_filename: true,
      unique_filename: true, // кожне завантаження отримує унікальний public_id,
      overwrite: false,      // щоб різні папки не ділили один файл і видалення було безпечним
      folder: "MovieList",
    };

    const result = await cloudinary.uploader.upload(image, options);

    res.json({
      url: result.url,
      publicId: result.public_id,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ title: "Image error", message: "failed to upload image" });
  }
};
