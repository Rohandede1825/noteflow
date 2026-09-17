/**
 * NoteFlow Paper Template Renderer
 * Matches Goodnotes Ruled, Dotted, Grid, and Blank canvas paper rendering.
 */

export const PAPER_PRESETS = {
  dark: {
    name: 'Dark',
    backgroundColor: '#282a2d', // Exact Goodnotes dark page background
    lineColor: '#3e4147',       // Subtle ruled line color
    marginLineColor: 'transparent', // Goodnotes dark ruled template does not display vertical red line by default
    dotColor: '#45484f'
  },
  white: {
    name: 'White',
    backgroundColor: '#FFFFFF',
    lineColor: '#E2E4E8',
    marginLineColor: '#E58B8B',
    dotColor: '#D1D5DB'
  },
  cream: {
    name: 'Cream',
    backgroundColor: '#FDFBF7',
    lineColor: '#E6E0D5',
    marginLineColor: '#E58B8B',
    dotColor: '#D8D1C3'
  }
};

export function renderPageTemplate(ctx, width, height, template = 'ruled', config = {}, isDarkMode = true) {
  const paperColorKey = config.paperColor || (isDarkMode ? 'dark' : 'white');
  const preset = PAPER_PRESETS[paperColorKey] || (isDarkMode ? PAPER_PRESETS.dark : PAPER_PRESETS.white);

  const backgroundColor = config.backgroundColor || preset.backgroundColor;
  const lineColor = config.lineColor || preset.lineColor;
  const marginLineColor = config.marginLineColor || preset.marginLineColor;
  const lineSpacing = config.lineSpacing || 44; // Comfortable 44px gap matching Goodnotes ruled notebook pages
  const gridSize = config.gridSize || 28;
  const showMargin = config.showMargin !== undefined ? config.showMargin : (template === 'ruled' && paperColorKey !== 'dark');

  ctx.save();

  // 1. Base Paper Background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  // 2. Templates
  if (template === 'ruled') {
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1;

    // Header top margin gap (approx 52px)
    const startY = 52;
    for (let y = startY; y < height; y += lineSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Left vertical margin line (if enabled)
    if (showMargin && marginLineColor !== 'transparent') {
      const marginX = 80;
      ctx.strokeStyle = marginLineColor;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(marginX, 0);
      ctx.lineTo(marginX, height);
      ctx.stroke();
    }
  } else if (template === 'grid') {
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 0.8;

    // Vertical lines
    for (let x = gridSize; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = gridSize; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  } else if (template === 'dotted') {
    ctx.fillStyle = config.dotColor || preset.dotColor;
    const spacing = gridSize || 28;
    const radius = config.dotSize || 1.25;

    for (let x = spacing; x < width; x += spacing) {
      for (let y = spacing; y < height; y += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  // 'blank' renders only the clean background color

  ctx.restore();
}
