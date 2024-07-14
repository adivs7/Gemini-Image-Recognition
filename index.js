import express from "express";
import multer from "multer";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs/promises";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = 3000;

const gemini_api_key = process.env.API_KEY;
const googleAI = new GoogleGenerativeAI(gemini_api_key);
const geminiConfig = {
  temperature: 0.4,
  topP: 1,
  topK: 32,
  maxOutputTokens: 4096,
};

const geminiModel = googleAI.getGenerativeModel({
  model: "gemini-pro-vision",
  geminiConfig,
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

app.use(express.static("public"));

app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    console.log("Image upload initiated.");
    const imagePath = req.file.path;

    console.log(`Reading image from ${imagePath}`);
    // Read the image file
    const imageFile = await fs.readFile(imagePath);
    const imageBase64 = imageFile.toString("base64");

    console.log("Image read successfully, generating prompt configuration.");
    const promptConfig = [
      { text: "Can you tell me about this image what's happening there?" },
      {
        inlineData: {
          mimeType: req.file.mimetype,
          data: imageBase64,
        },
      },
    ];

    console.log("Calling Gemini model...");
    const result = await geminiModel.generateContent({
      contents: [{ role: "user", parts: promptConfig }],
    });

    console.log("Processing Gemini response.");
    const response = await result.response;

    console.log("Removing uploaded file after processing.");
    // Remove the uploaded file after processing
    await fs.unlink(imagePath);

    console.log("Sending response back to client.");
    // Send the response back to the client
    res.json({ response: response.text() });
  } catch (error) {
    console.error("Error during image processing:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
