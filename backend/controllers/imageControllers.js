import cloudinary from "../utils/cloudinary.js";

// Delete errors are only logged so a failed image removal never breaks the main operation.
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

    if (!image) {
      return res.status(400).json({ title: "Image error", message: "no image in the request" });
    }

    const options = {
      use_filename: true,
      unique_filename: true, // unique public_id per upload: folders never share a file, so deletes stay safe
      overwrite: false,
      folder: "MovieList",
    };

    const result = await cloudinary.uploader.upload(image, options);

    res.json({
      url: result.url,
      publicId: result.public_id,
    });
  } catch (error) {
    console.log("Cloudinary upload error:", error);
    // Return the real reason (e.g. missing Cloudinary env) instead of a generic message.
    const reason = error?.message || error?.error?.message;
    res.status(400).json({
      title: "Image error",
      message: reason ? `failed to upload image: ${reason}` : "failed to upload image",
    });
  }
};
