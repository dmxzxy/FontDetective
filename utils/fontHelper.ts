import { LoadedFont } from "../types";

export const loadFontFile = async (file: File): Promise<LoadedFont> => {
  const arrayBuffer = await file.arrayBuffer();
  // Sanitize font family name to be safe for CSS
  const familyName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, "");
  const fontFace = new FontFace(familyName, arrayBuffer);
  
  await fontFace.load();
  document.fonts.add(fontFace);

  return {
    name: file.name,
    family: familyName,
    file
  };
};

export const createComparisonSheet = (
  text: string, 
  fonts: LoadedFont[]
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error("Could not get canvas context");
    }

    const padding = 40;
    const itemHeight = 100;
    const width = 800;
    const headerHeight = 60;
    const height = headerHeight + (fonts.length * itemHeight) + padding;

    canvas.width = width;
    canvas.height = height;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Header
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, width, headerHeight);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.fillText("Font Candidate Reference Sheet", padding, 40);

    // Render each font
    fonts.forEach((font, index) => {
      const y = headerHeight + padding + (index * itemHeight);
      
      // Label (Font Name)
      ctx.fillStyle = '#64748b'; // Slate 500
      ctx.font = '14px Inter, sans-serif';
      ctx.fillText(`${index + 1}. ${font.name}`, padding, y);

      // Sample Text in Custom Font
      ctx.fillStyle = '#000000';
      // Fallback to serif to make failures obvious, but font should be loaded
      ctx.font = `48px "${font.family}", serif`; 
      ctx.fillText(text, padding, y + 55);

      // Divider line
      if (index < fonts.length - 1) {
        ctx.strokeStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.moveTo(padding, y + 70);
        ctx.lineTo(width - padding, y + 70);
        ctx.stroke();
      }
    });

    resolve(canvas.toDataURL('image/png'));
  });
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};
