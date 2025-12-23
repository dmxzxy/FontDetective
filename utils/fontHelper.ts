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

// Helper to wrap text
const wrapText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  // If text has no spaces (long string), split by chars
  if (words.length === 1 && text.length > 10) {
      const chars = text.split('');
      for (let n = 0; n < chars.length; n++) {
        const testLine = line + chars[n];
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
          ctx.fillText(line, x, currentY);
          line = chars[n];
          currentY += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, x, currentY);
      return currentY + lineHeight;
  }

  for(let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
  return currentY + lineHeight;
}

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
    const width = 900; // Increased width slightly
    const headerHeight = 70;
    
    // Increased font size means increased line height estimates
    const FONT_SIZE = 60; // Increased from 48
    const LINE_HEIGHT = FONT_SIZE * 1.3;
    
    // Estimate height dynamically
    // A rough estimate: chars per line ~ width / (font_size * 0.5)
    // 900 / 30 = 30 chars per line roughly.
    const estimatedLinesPerFont = Math.ceil(text.length / 20) + 1; 
    const itemHeight = 40 + (estimatedLinesPerFont * LINE_HEIGHT); 
    
    const height = headerHeight + (fonts.length * itemHeight) + padding;

    canvas.width = width;
    canvas.height = height;

    // Background - Pure White for max contrast
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Header
    ctx.fillStyle = '#0f172a'; // Darker Slate
    ctx.fillRect(0, 0, width, headerHeight);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Inter, sans-serif';
    ctx.fillText("Font Candidate Reference Sheet", padding, 45);

    let currentY = headerHeight + padding;

    // Render each font
    fonts.forEach((font, index) => {
      // Label (Font Name)
      ctx.fillStyle = '#475569'; // Slate 600
      ctx.font = 'bold 16px Inter, sans-serif';
      ctx.fillText(`${index + 1}. ${font.name}`, padding, currentY);
      currentY += 30; // Space after label

      // Sample Text in Custom Font
      ctx.fillStyle = '#000000'; // Pure Black
      ctx.font = `${FONT_SIZE}px "${font.family}", serif`; 
      
      // Use wrapText helper
      const nextY = wrapText(ctx, text, padding, currentY + (FONT_SIZE/2), width - (padding * 2), LINE_HEIGHT);
      
      currentY = nextY + 40; // Add padding after text block

      // Divider line
      if (index < fonts.length - 1) {
        ctx.strokeStyle = '#cbd5e1'; // Slate 300
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, currentY - 20);
        ctx.lineTo(width - padding, currentY - 20);
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
