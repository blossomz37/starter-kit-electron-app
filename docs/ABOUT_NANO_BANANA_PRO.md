---
model: google/gemini-3-pro-image-preview
source: https://openrouter.ai/google/gemini-3-pro-image-preview/api
---

# Google: Nano Banana Pro (Gemini 3 Pro Image Preview)

Created Nov 20, 2025
65,536 context
$2/M input tokens
$12/M output tokens
$120/M tokens

Nano Banana Pro is Google’s most advanced image-generation and editing model, built on Gemini 3 Pro. It extends the original Nano Banana with significantly improved multimodal reasoning, real-world grounding, and high-fidelity visual synthesis. The model generates context-rich graphics, from infographics and diagrams to cinematic composites, and can incorporate real-time information via Search grounding.

It offers industry-leading text rendering in images (including long passages and multilingual layouts), consistent multi-image blending, and accurate identity preservation across up to five subjects. Nano Banana Pro adds fine-grained creative controls such as localized edits, lighting and focus adjustments, camera transformations, and support for 2K/4K outputs and flexible aspect ratios. It is designed for professional-grade design, product visualization, storyboarding, and complex multi-element compositions while remaining efficient for general image creation workflows.


## Quickstart

Sample code and API for Nano Banana Pro (Gemini 3 Pro Image Preview)
OpenRouter normalizes requests and responses across providers for you.
Create API key
OpenRouter supports image generation through models that have image in their output modalities. These models can create images from text prompts when you specify modalities: ["image", "text"] in your request. The generated images are returned as base64-encoded data URLs in the assistant message. Learn more about image generation.

In the example below, the OpenRouter-specific headers are optional. Setting them allows your app to appear on the OpenRouter leaderboards.

@openrouter/sdk

```
import { OpenRouter } from "@openrouter/sdk";

const openrouter = new OpenRouter({
  apiKey: "<OPENROUTER_API_KEY>"
});

const result = await openrouter.chat.send({
  model: "google/gemini-3-pro-image-preview",
  messages: [
    {
      role: "user",
      content: "Generate a beautiful sunset over mountains"
    }
  ],
  modalities: ["image", "text"]
});

const message = result.choices[0].message;
if (message.images) {
  message.images.forEach((image, index) => {
    const imageUrl = image.image_url.url;
    console.log(`Generated image ${index + 1}: ${imageUrl.substring(0, 50)}...`);
  });
}
```