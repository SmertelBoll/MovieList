import PostModel from "../models/post.js";
import UserModel from "../models/user.js";
import FolderModel from "../models/folder.js";


// Виділяємо логіку отримання назв папок у окрему функцію
const getAllFoldersByUserHelper = async (userId) => {
  try {
    const foldersByUser = await FolderModel.find({ user: userId }).exec();
    return foldersByUser;
  } catch (error) {
    console.log(error);
    throw new Error("Failed to get folders");
  }
};

// Використовуємо допоміжну функцію у API-функції
export const getAllFoldersByUser = async (req, res) => {
  try {
    const userId = req.userId;
    const foldersByUser = await getAllFoldersByUserHelper(userId);
    res.send(foldersByUser);
  } catch (error) {
    res.status(500).json({ title: "Folders error", message: "could not get folders" });
  }
};

export const createFolder = async (req, res) => {
  try {
    const name = req.body.name;
    const userId = req.userId;

    const userFolders = await getAllFoldersByUserHelper(userId);

    const order = userFolders.length

    const doc = new FolderModel({
      name: name,
      order: order,
      user: userId
    });

    const folder = await doc.save();

    res.json(folder);
  } catch (error) {
    console.log(error);
    res.status(500).json({ title: "Folders error", message: "failed to create folder" });
  }
};

export const renameFolderByOrder = async (req, res) => {
  try {
    const folderOrder = req.params.order;
    const newFolderName = req.body.name;
    const userId = req.userId;

    const currentFolder = await FolderModel.findOne({ order: folderOrder, user: userId });

    if (!currentFolder) {
      return res.status(404).json({ title: "Folder not found", message: "no folder found" });
    }

    const userFolders = await getAllFoldersByUserHelper(userId);
    const folderNames = userFolders.map(folder => folder.name);

    if (folderNames.includes(newFolderName) && folder.name !== newFolderName) {
      return res.status(400).json({ title: "Folders error", message: "the folder name must be unique" });
    }

    // Оновити поле name
    currentFolder.name = newFolderName;

    // Зберегти зміни
    await currentFolder.save();

    // Відповідь з оновленою папкою
    res.json(currentFolder);
  } catch (error) {
    console.log(error);
    res.status(500).json({ title: "Folders error", message: "failed to get folders" });
  }
}

export const removeFolder = async (req, res) => {
  try {
    const folderOrder = req.params.order;
    const userId = req.userId;

    const currentFolder = await FolderModel.find({ order: folderOrder, user: userId }).populate("user").exec();
    const currentUser = await UserModel.findById(userId);

    if (userId !== currentFolder[0].user._id.toString() && currentUser.accessLevel !== "admin") {
      console.log("access is denied");
      return res.status(500).json({ title: "Folder error", message: "access is denied" });
    }

    const folder = await FolderModel.findOneAndDelete({
      order: folderOrder,
      user: userId
    });

    if (!folder) {
      return res.status(404).json({
        title: "Folder error",
        message: "folder not found",
      });
    }

    const foldersByUser = await getAllFoldersByUserHelper(userId);

    const orders = foldersByUser.map(folder => folder.order);                                 // Отримуємо масив значень order
    const sortedOrders = [...orders].sort((a, b) => a - b);                                   // Сортуємо масив order
    const newOrders = Array.from({ length: sortedOrders.length }, (_, index) => index);   // Створюємо новий масив без пропусків
    const mapping = {};                                                                       // Створюємо мапу старих значень до нових
    sortedOrders.forEach((value, index) => {
      mapping[value] = newOrders[index];
    });

    // Оновлюємо order для кожного об'єкта в foldersByUser
    const updatedFolders = foldersByUser.map(folder => {
      const folderObject = folder.toObject(); // Перетворюємо на звичайний об'єкт
      return {
        ...folderObject,
        order: mapping[folderObject.order] // Оновлюємо значення order
      };
    });

    // Зберігаємо оновлені папки у базі даних
    const updatePromises = updatedFolders.map(folder => {
      return FolderModel.updateOne({ _id: folder._id }, { order: folder.order });
    });

    await Promise.all(updatePromises); // Чекаємо, поки всі оновлення завершаться

    res.json({
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ title: "Folder error", message: "failed to delete folder" });
  }
};

// Виділяємо логіку змінити черги у окрему функцію
export const changeOrder = async (upOrDown, folderOrder, userId) => {
  try {
    const elseOrder = folderOrder + upOrDown;

    const currentFolder = await FolderModel.findOne({ order: folderOrder, user: userId });
    const elseFolder = await FolderModel.findOne({ order: elseOrder, user: userId });

    if (!elseFolder) {
      return {
        success: false,
      };
    }


    currentFolder.order = elseOrder;
    elseFolder.order = folderOrder;

    await currentFolder.save();
    await elseFolder.save();

    return {
      success: true,
    };
  } catch (error) {
    console.log(error);
    throw new Error("Failed to change order");
  }
};

export const orderIncrement = async (req, res) => {
  try {
    const folderOrder = Number(req.params.order);
    const userId = req.userId;

    const success = await changeOrder(1, folderOrder, userId);
    return res.json(success)
  } catch (error) {
    console.log(error);
    res.status(500).json({ title: "Folder error", message: "failed to change folder order" });
  }
}

export const orderDecrement = async (req, res) => {
  try {
    const folderOrder = Number(req.params.order);
    const userId = req.userId;

    const success = await changeOrder(-1, folderOrder, userId);
    return res.json(success)
  } catch (error) {
    console.log(error);
    res.status(500).json({ title: "Folder error", message: "failed to change folder order" });
  }
}

export const addMovieToFolder = async (req, res) => {
  try {
    const currentUserId = req.userId;
    const folderName = req.body.folderName;

    const movieId = req.body.movieId;
    const dateAdded = req.body.dateAdded;
    const rating = req.body.rating;
    const comment = req.body.comment;

    if (!folderName) {
      return res.status(400).json({ title: "Folder error", message: "no folder selected" });
    }
    if (!movieId) {
      return res.status(400).json({ title: "Folder error", message: "no movie selected" });
    }

    const newElement = {
      movieId,
      dateAdded,
      rating,
      comment
    }

    const updatedFolder = await FolderModel.findOneAndUpdate(
      { name: folderName, user: currentUserId }, // Шукаємо папку за ім'ям
      { $push: { folderElements: newElement } }, // Додаємо новий фільм у масив
      { new: true } // Повертаємо оновлену папку
    );

    if (!updatedFolder) {
      return res.status(404).json({ title: "Folder error", message: "folder not found" });
    }

    res.json({
      success: updatedFolder,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ title: "Folder error", message: "failed to add movie" });
  }
};










export const getAllPosts = async (req, res) => {
  try {
    const filter = req.query.filter || "";
    const regex = new RegExp(filter, "i");

    const sortBy = req.query.sortBy;
    const sortObj = {};

    let posts = [];

    if (sortBy) {
      sortObj[sortBy] = -1;
      posts = await PostModel.find({ title: regex }).sort(sortObj).populate("user").exec();
    } else {
      if (filter) {
        posts = await PostModel.find({ title: regex }).sort({ viewsCount: -1 }).populate("user").exec();
      } else {
        posts = await PostModel.find({ title: regex }).sort({ createdAt: -1 }).populate("user").exec();
      }
    }

    res.send(posts);
  } catch (error) {
    console.log(error);
    res.status(500).json({ title: "Article error", message: "failed to get articles" });
  }
};

export const getOnePost = async (req, res) => {
  try {
    const postId = req.params.id;

    const posts = await PostModel.findOneAndUpdate(
      // filter
      {
        _id: postId, //по чому шукаємо
      },
      // update
      {
        $inc: { viewsCount: 1 }, // збільшити на 1
      },
      // return new or not
      {
        new: true,
      }
    ).populate("user");

    res.send(posts);
  } catch (error) {
    console.log(error);
    res.status(500).json({ title: "Article error", message: "failed to get article" });
  }
};

export const createPost = async (req, res) => {
  try {
    const image = req.body.image;

    const doc = new PostModel({
      title: req.body.title,
      text: req.body.text,
      tags: req.body.tags,
      image: image ? image : "",
      user: req.userId,
    });

    const post = await doc.save();

    res.json(post);
  } catch (error) {
    console.log(error);
    res.status(500).json({ title: "Article error", message: "failed to create article" });
  }
};

export const removePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const currentUserId = req.userId;

    const currentPost = await PostModel.find({ _id: postId }).populate("user").exec();
    const currentUser = await UserModel.findById(currentUserId);

    if (currentUserId !== currentPost[0].user._id.toString() && currentUser.accessLevel !== "admin") {
      console.log("access is denied");
      return res.status(500).json({ title: "Article error", message: "access is denied" });
    }

    const post = await PostModel.findOneAndDelete({
      _id: postId,
    });

    if (!post) {
      return res.status(404).json({
        title: "Article error",
        message: "article not found",
      });
    }

    res.json({
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ title: "Article error", message: "failed to delete article" });
  }
};

export const updatePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const currentUserId = req.userId;

    const post = await PostModel.find({ _id: postId }).populate("user").exec();
    const currentUser = await UserModel.findById(currentUserId);

    if (currentUserId !== post[0].user._id.toString() && currentUser.accessLevel !== "admin") {
      console.log("access is denied");
      return res.status(500).json({ title: "Article error", message: "access is denied" });
    }

    const image = req.body.image;

    await PostModel.updateOne(
      {
        _id: postId,
      },
      {
        title: req.body.title,
        text: req.body.text,
        tags: req.body.tags,
        image: req.body.image,
        user: post[0].user._id,
      }
    );

    res.json({
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ title: "Article error", message: "failed to update the article" });
  }
};
