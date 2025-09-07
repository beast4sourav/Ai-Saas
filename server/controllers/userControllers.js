import Creation from "../models/creationModel.js";  // import your model

// Get all creations of the logged-in user
export const getUserCreations = async (req, res) => {
  try {
    const { userId } = req.auth();
    const creations = await Creation.find({ userId }).sort({ createdAt: -1 });
    res.json({ success: true, creations });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get all published creations (no user filter, only publish = true)
export const getPublishedCreations = async (req, res) => {
  try {
    const creations = await Creation.find({ publish: true }).sort({
      createdAt: -1,
    });
    res.json({ success: true, creations });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Toggle like for a creation
export const toggleLikeCreation = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.body;

    const creation = await Creation.findById(id);

    if (!creation) {
      return res.json({ success: false, message: "Creation not found" });
    }

    const userIdStr = userId.toString();
    let message;

    if (creation.likes && creation.likes.includes(userIdStr)) {
      // remove like
      creation.likes = creation.likes.filter((like) => like !== userIdStr);
      message = "Like removed";
    } else {
      // add like
      creation.likes = [...(creation.likes || []), userIdStr];
      message = "Like added";
    }

    await creation.save();

    res.json({ success: true, message, likes: creation.likes });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
