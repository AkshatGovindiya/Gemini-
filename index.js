const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

// Initialize Google Generative AI client
const genAI = new GoogleGenerativeAI("AIzaSyAVu4ut5_IpsG3C8nZkTClGmFCkkIItVP0"); 
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const app = express();
app.use(cors()); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({ dest: "uploads/" });

const prompt = 'Provide a detailed health analysis of the food item, including total calories, breakdown of carbohydrates, fats, and proteins, key vitamins and minerals (e.g., Vitamin A, B, C, D, Calcium, Iron), presence of other elements like cholesterol or sodium, health benefits, potential drawbacks, and whether it can be considered a healthy option overall.'

async function generateTextFromImage(imagePath) {
    const image = {
      inlineData: {
        data: Buffer.from(fs.readFileSync(imagePath)).toString("base64"),
        mimeType: "image/jpg", 
      },
    };
  
    try {
      const result = await model.generateContent([ prompt,image]);
      console.log("API Response:", JSON.stringify(result, null, 2)); 
  
      if (result && result.response && result.response.candidates && result.response.candidates.length > 0) {
        return result.response.candidates[0].content.parts[0].text; 
      } else {
        throw new Error("Unexpected response structure from the API.");
      }
    } catch (error) {
      console.error("Error from GEMINI API", error);
      throw error; 
    }
  }
      
  
app.get("/",(req,res)=>{
    res.send("Hello from GEMINI API");
})


app.post("/generate-text-from-image", upload.single("image"), async (req, res) => {
  try {
    const filePath = path.join(__dirname, req.file.path);
    const generatedText = await generateTextFromImage(filePath);

    // Remove the uploaded file after processing
    fs.unlinkSync(filePath);

    res.json({ text: generatedText });
  } catch (error) {
    console.error("Error generating text from image:", error);
    res.status(500).send("Internal Server Error");
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
