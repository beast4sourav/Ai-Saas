import OpenAI from "openai";
import Creation from "../models/creationModel.js";
import { clerkClient } from "@clerk/express";
import FormData from "form-data";
import { v2 as cloudinary } from "cloudinary";
import axios from "axios";
import fs from 'fs'
import Pdf from "pdf-parse/lib/pdf-parse.js";

const AI = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateArticle = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt, length } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (plan !== "premium" && free_usage >= 10) {
      return res.json({
        success: false,
        message: "Free usage limit exceeded. Please upgrade to premium.",
      });
    }

    const response = await AI.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: length,
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;

    await Creation.create({ userId, prompt, content, type: "article" });

    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: { free_usage: free_usage + 1 },
      });
    }

    res.json({ success: true, content });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const generateBlogTitle = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (plan !== "premium" && free_usage >= 10) {
      return res.json({
        success: false,
        message: "Free usage limit exceeded. Please upgrade to premium.",
      });
    }

    const response = await AI.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 100,
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;

    await Creation.create({ userId, prompt, content, type: "blog-title" });

    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: { free_usage: free_usage + 1 },
      });
    }

    res.json({ success: true, content });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const generateImage = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt, publish } = req.body;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "This feature is only available for premium subscriptions.",
      });
    }

    const formData = new FormData();
    formData.append("prompt", prompt);

    const { data } = await axios.post(
      "https://clipdrop-api.co/text-to-image/v1",
      formData,
      {
        headers: { "x-api-key": process.env.CLIPDROP_API_KEY },
        responseType: "arraybuffer",
      }
    );

    const base64Image = `data:image/png;base64,${Buffer.from(
      data,
      "binary"
    ).toString("base64")}`;

    const { secure_url } = await cloudinary.uploader.upload(base64Image);

    await Creation.create({
      userId,
      prompt,
      secure_url, // ✅ only save secure_url for images
      publish,
      type: "image",
    });

    res.json({ success: true, imageUrl: secure_url });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const removeImageBackground = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { image } = req.file;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "This feature is only available for premium subscriptions.",
      });
    }

    const formData = new FormData();
    formData.append("prompt", prompt);

    const { secure_url } = await cloudinary.uploader.upload(image.path, {
      transformation: [
        {
          effect: "background_removal",
          background_removal: "remove_the_background",
        },
      ],
    });

    await Creation.create({
      userId,
      prompt: "Remove background from image", // ✅ use as prompt description
      secure_url, // ✅ only save image URL
      type: "image",
    });

    res.json({ success: true, imageUrl: secure_url });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const removeImageObject = async (req, res) => {
    try {
      const { userId } = req.auth();
      const { object } = req.body;
      const { image } = req.file;
      const plan = req.plan;
  
      if (plan !== "premium") {
        return res.json({
          success: false,
          message: "This feature is only available for premium subscriptions.",
        });
      }
      const { public_id } = await cloudinary.uploader.upload(image.path);

      const imageUrl =  cloudinary.url(public_id,{
        transformation: [{effect: `gen_remove:${object}`}],
        resource_type: 'image'
      })
  
      await Creation.create({
        userId,
        prompt: "Remove background from image", // ✅ use as prompt description
        imageUrl, // ✅ only save image URL
        type: "image",
      });
  
      res.json({ success: true, imageUrl: imageUrl });
    } catch (error) {
      console.error(error.message);
      res.json({ success: false, message: error.message });
    }
  };
  

  export const resumeReview = async (req, res) => {
    try {
      const { userId } = req.auth();
      const resume = req.file;
      const plan = req.plan;
  
      if (plan !== "premium") {
        return res.json({
          success: false,
          message: "This feature is only available for premium subscriptions.",
        });
      }
      if(resume.size > 5* 1024 *1024){
        return res.json({success: false, message:"Resume file size exceds allowed size (5MB)."})
      }

      const dataBuffer = fs.readFileSync(resume.path)
      const pdfData = await Pdf(dataBuffer)

      const prompt = `Review my resume and suggest improvements. Here is the content: ${pdfData.text}`

      const response = await AI.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
        temperature: 0.7,
      });
  
      const content = response.choices[0].message.content;
  
      await Creation.create({
        userId,
        prompt: "Review the uploaded resume", // ✅ use as prompt description
        content, // ✅ only save image URL
        type: "image",
      });
  
      res.json({ success: true, content});
    } catch (error) {
      console.error(error.message);
      res.json({ success: false, message: error.message });
    }
  };
  
