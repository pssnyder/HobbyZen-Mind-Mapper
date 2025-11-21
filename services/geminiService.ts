import { GoogleGenAI, Type } from "@google/genai";
import { TreeNode } from '../types';

// Initialize the Gemini API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = "gemini-2.5-flash";

export const generateTreeStructure = async (context: string): Promise<TreeNode> => {
  const prompt = `
    You are an expert organization consultant. 
    Analyze the following list of hobbies and artifacts provided by a user who feels cluttered.
    
    User Context: "${context}"
    
    Task: Organize these into a hierarchical JSON tree structure.
    1. Root is "My Life".
    2. First level children are "Mind" (Mental Realm) and "Body" (Physical Realm).
    3. Categorize the hobbies into these realms. If a hobby fits both, choose the dominant one.
    4. Place "artifacts" (gear, collections) as children of the specific hobbies they belong to.
    5. Infer the 'status' of items. 
       - If an item seems redundant (like "economy lenses" when "premium lenses" exist), mark status as 'sell' or 'donate'.
       - If an item is core to a hobby, mark as 'keep'.
       - Default to 'review' if unsure.
    
    Return ONLY the JSON object matching this schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['root', 'realm', 'hobby', 'path', 'artifact'] },
                status: { type: Type.STRING, enum: ['keep', 'review', 'discard', 'sell', 'donate'] },
                description: { type: Type.STRING },
                children: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            name: { type: Type.STRING },
                            type: { type: Type.STRING },
                            status: { type: Type.STRING },
                            description: { type: Type.STRING },
                            children: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        id: { type: Type.STRING },
                                        name: { type: Type.STRING },
                                        type: { type: Type.STRING },
                                        status: { type: Type.STRING },
                                        description: { type: Type.STRING },
                                        children: {
                                            type: Type.ARRAY,
                                            items: {
                                                type: Type.OBJECT,
                                                properties: {
                                                    id: { type: Type.STRING },
                                                    name: { type: Type.STRING },
                                                    type: { type: Type.STRING },
                                                    status: { type: Type.STRING },
                                                    description: { type: Type.STRING },
                                                    children: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: {} } }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as TreeNode;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const expandNodeChildren = async (nodeName: string, nodeType: string, context: string): Promise<TreeNode[]> => {
    const prompt = `
      I am organizing my hobbies. I have a node named "${nodeName}" (Type: ${nodeType}).
      
      Look at my full inventory/context below:
      "${context}"
      
      Task: Identify specific items, artifacts, sub-skills, or paths from this list that belong specifically to "${nodeName}".
      Return a list of child nodes.
      
      - If "${nodeName}" is a Realm (Mind/Body), find top-level Hobbies from the list that fit.
      - If "${nodeName}" is a Hobby, find paths (sub-skills) or artifacts (gear) from the list.
      
      Strictly return a JSON Array of objects.
    `;
  
    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
              type: Type.ARRAY,
              items: {
                  type: Type.OBJECT,
                  properties: {
                      id: { type: Type.STRING },
                      name: { type: Type.STRING },
                      type: { type: Type.STRING, enum: ['hobby', 'path', 'artifact'] },
                      status: { type: Type.STRING, enum: ['keep', 'review', 'discard', 'sell', 'donate'] },
                      description: { type: Type.STRING },
                      children: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: {} } }
                  }
              }
          }
        }
      });
  
      const text = response.text;
      if (!text) return [];
      
      // Post-process IDs to ensure uniqueness
      const children = JSON.parse(text) as TreeNode[];
      return children.map(c => ({...c, id: `${nodeName}-${c.name}-${Math.random().toString(36).substr(2, 5)}`}));
    } catch (error) {
      console.error("Gemini Expansion Error:", error);
      return [];
    }
  };

export const getPruningAdvice = async (node: TreeNode): Promise<string> => {
  const prompt = `
    Analyze this specific node in a hobbyist's mind map:
    Name: ${node.name}
    Type: ${node.type}
    Current Status: ${node.status}
    Description: ${node.description || 'None'}
    
    The user wants to declutter. Give 2-3 concise sentences of advice on whether to keep, sell, or donate this item/hobby based on general minimalism principles and the goal of "fulfillment".
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return response.text || "No advice generated.";
  } catch (error) {
    return "Unable to retrieve advice at this time.";
  }
};