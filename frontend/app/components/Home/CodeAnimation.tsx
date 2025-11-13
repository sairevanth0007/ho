import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

const codeSnippet = [
  { text: "# Create", highlight: false, type: "comment" },
  { text: '@app.post("/items/", response_model=ItemOut)', highlight: false, type: "code" },
  { text: "def create_item(item: Item):", highlight: false, type: "code" },
  { text: "    result = collection.insert_one(item.dict())", highlight: true, type: "code" },
  { text: '    new_item = collection.find_one({"_id": result.inserted_id})', highlight: false, type: "code" },
  { text: "    return serialize_item(new_item)", highlight: false, type: "code" },
  { text: " ", highlight: false, type: "code" },
  { text: "# Read All", highlight: false, type: "comment" },
  { text: '@app.get("/items/", response_model=List[ItemOut])', highlight: false, type: "code" },
  { text: "def get_items():", highlight: false, type: "code" },
  { text: "    items = list(collection.find())", highlight: true, type: "code" },
  { text: "    return [serialize_item(i) for i in items]", highlight: false, type: "code" },
  { text: " ", highlight: false, type: "code" },
  { text: "# Read One", highlight: false, type: "comment" },
  { text: '@app.get("/items/{item_id}", response_model=ItemOut)', highlight: false, type: "code" },
  { text: "def get_item(item_id: str):", highlight: false, type: "code" },
  { text: '    item = collection.find_one({"_id": ObjectId(item_id)})', highlight: true, type: "code" },
  { text: "    if item:", highlight: false, type: "code" },
  { text: "        return serialize_item(item)", highlight: false, type: "code" },
  { text: '    raise HTTPException(status_code=404, detail="Item not found")', highlight: false, type: "code" },
  { text: " ", highlight: false, type: "code" },
  { text: "# Update", highlight: false, type: "comment" },
  { text: '@app.put("/items/{item_id}", response_model=ItemOut)', highlight: false, type: "code" },
  { text: "def update_item(item_id: str, updated_item: Item):", highlight: false, type: "code" },
  { text: '    result = collection.update_one({"_id": ObjectId(item_id)}, {"$set": updated_item.dict()})', highlight: true, type: "code" },
  { text: "    if result.modified_count == 1:", highlight: false, type: "code" },
  { text: '        item = collection.find_one({"_id": ObjectId(item_id)})', highlight: false, type: "code" },
  { text: "        return serialize_item(item)", highlight: false, type: "code" },
  { text: '    raise HTTPException(status_code=404, detail="Item not found or unchanged")', highlight: false, type: "code" },
  { text: " ", highlight: false, type: "code" },
  { text: "# Delete", highlight: false, type: "comment" },
  { text: '@app.delete("/items/{item_id}")', highlight: false, type: "code" },
  { text: "def delete_item(item_id: str):", highlight: false, type: "code" },
  { text: '    result = collection.delete_one({"_id": ObjectId(item_id)})', highlight: true, type: "code" },
  { text: "    if result.deleted_count == 1:", highlight: false, type: "code" },
  { text: '        return {"message": "Item deleted"}', highlight: false, type: "code" },
  { text: '    raise HTTPException(status_code=404, detail="Item not found")', highlight: false, type: "code" }
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const CodeAnimation: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsVisible(true);
    }, 500);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="code-bg rounded-lg p-4 bg-[#1e1e1e] text-white font-mono text-sm overflow-x-auto max-w-full">
      <motion.div
        className="code-content"
        variants={container}
        initial="hidden"
        animate={isVisible ? "show" : "hidden"}
      >
        {codeSnippet.map((line, index) => (
          <motion.pre
            key={index}
            className={`code-line flex ${line.highlight ? "font-bold" : ""}`}
            data-line={index + 1}
            variants={item}
          >
            <span className="text-gray-500 w-8 text-right pr-3 select-none">{index + 1}</span>
            <code className={`whitespace-pre-wrap ${line.type === "comment" ? "text-green-400" : ""}`}>
              {line.text.split("").map((char, charIndex) => (
                <span
                  key={charIndex}
                  className={`${
                    ["(", ")", "{", "}", ".", ";"].includes(char)
                      ? "text-yellow-300"
                      : ["function", "const", "if", "return", "def", "raise"].some((kw) =>
                          line.text.includes(kw)
                        )
                      ? "text-blue-400"
                      : line.highlight
                      ? "text-purple-400"
                      : ""
                  }`}
                >
                  {char}
                </span>
              ))}
            </code>
          </motion.pre>
        ))}
      </motion.div>
    </div>
  );
};

export default CodeAnimation;
