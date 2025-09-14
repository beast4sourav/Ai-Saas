import { Image, Sparkles } from "lucide-react";
import React, { useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const GenerateImages = () => {
  const imageStyle = [
    "Realistic",
    "Ghibli style",
    "Anime style",
    "Cartoon style",
    "Fantasy style",
    "3D style",
    "Portrait style"
  ];

  const [selectedStyle, setSelectedStyle] = useState("Realistic");
  const [input, setInput] = useState("");
  const [publish, setPublish] = useState(false);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");

  const { getToken } = useAuth();

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const prompt = `Generate an image of ${input} in ${selectedStyle}`;
  
      const { data } = await axios.post(
        "/api/ai/generate-image",
        { prompt, publish },
        {
          headers: { Authorization: `Bearer ${await getToken()}` },
        }
      );
  
      if (data.success) {
        setContent(data.imageUrl); 
        // If image was published, refresh the community page
        if (publish && window.refreshCommunity) {
          setTimeout(() => {
            window.refreshCommunity();
          }, 1000); // Small delay to ensure the image is saved
        }
      } else {
        toast.error(data.message || "Image generation failed.");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Something went wrong");
    }
    setLoading(false);
  };

  return (
    <div className="h-full overflow-y-scroll p-6 flex flex-col md:flex-row gap-6 text-slate-700">
      {/* Left Column */}
      <form
        onSubmit={onSubmitHandler}
        className="w-full max-w-lg p-6 bg-white rounded-2xl border border-gray-200 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 text-[#00AD25]" />
          <h1 className="text-xl font-semibold">AI Image Generator</h1>
        </div>

        <p className="mt-6 text-sm font-medium">Describe Your Image</p>
        <textarea
          onChange={(e) => setInput(e.target.value)}
          rows={4}
          value={input}
          className="w-full p-3 mt-2 outline-none text-sm rounded-md border border-gray-300 focus:ring-2 focus:ring-green-400"
          placeholder="Describe what you want to see in the image..."
          required
        />

        <p className="mt-4 text-sm font-medium">Style</p>
        <div className="mt-3 flex gap-2 flex-wrap">
          {imageStyle.map((item) => (
            <span
              key={item}
              onClick={() => setSelectedStyle(item)}
              className={`text-xs px-4 py-1 border rounded-full cursor-pointer transition ${
                selectedStyle === item
                  ? "bg-green-100 text-green-700 border-green-400"
                  : "text-gray-500 border-gray-300 hover:bg-gray-100"
              }`}
            >
              {item}
            </span>
          ))}
        </div>

        <div className="my-6 flex items-center gap-2">
          <label className="relative cursor-pointer">
            <input
              type="checkbox"
              onChange={(e) => setPublish(e.target.checked)}
              checked={publish}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-300 rounded-full peer-checked:bg-green-500 transition"></div>
            <span className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition peer-checked:translate-x-4"></span>
          </label>
          <p className="text-sm">Make this image public</p>
        </div>

        <button
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#00AD25] to-[#04FF50] text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="w-4 h-4 my-1 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
          ) : (
            <Image className="w-5" />
          )}
          {loading ? "Generating..." : "Generate Image"}
        </button>
      </form>

      {/* Right Column */}
      <div className="w-full max-w-lg p-6 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col min-h-[400px]">
        <div className="flex items-center gap-3">
          <Image className="w-5 h-5 text-[#00AD25]" />
          <h1 className="text-xl font-semibold">Generated Image</h1>
        </div>

        {!content ? (
          <div className="flex-1 flex justify-center items-center">
            <div className="text-sm flex flex-col items-center gap-3 text-gray-400">
              <Image className="w-9 h-9" />
              <p>Enter a description and click "Generate Image" to get started</p>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex-1 flex justify-center items-center">
            <img
              src={content}
              alt="Generated"
              className="w-full max-h-[400px] object-contain rounded-lg shadow"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateImages;
