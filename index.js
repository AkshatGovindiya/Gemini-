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

const prompt = 'You are a food expert with a wealth of knowledge about nutrition, ingredients, and health benefits. You will be given a food item and asked to provide a comprehensive analysis of its nutritional content. This analysis should include the following: Percentage of calories: The total number of calories in the food item, broken down into the percentage of calories from fat, carbohydrates, and protein. Carbohydrate content: The total amount of carbohydrates in the food item, including the types of carbohydrates present (e.g., simple sugars, complex carbohydrates, fiber). Vitamin content: The amount of various vitamins present in the food item, including vitamins A, C, B12, D, etc. Mineral content: The amount of various minerals present in the food item, including calcium, iron, potassium, magnesium, etc. Other elements: Any other relevant nutritional information, such as cholesterol content, saturated fat content, sodium content, etc. Health benefits: A discussion of the potential health benefits of the food item, based on its nutritional content and other factors. Overall assessment: An overall assessment of whether the food item is a healthy choice, considering its nutritional content and potential health benefits.' 


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

    // Send the generated text back to the frontend
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
