import cloudinary from "../utils/cloudinary.js";

export const uploadFile = async (req, res) => {
  try {
    const { image } = req.body;

    const options = {
      use_filename: true,
      unique_filename: false,
      overwrite: true,
      folder: "myArticle",
    };

    const result = await cloudinary.uploader.upload(image, options);

    res.json({
      url: result.url,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ title: "Image error", message: "failed to upload image" });
  }
};
