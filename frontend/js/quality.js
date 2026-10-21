/**
 * Quality Checker for Camera Frames
 * Evaluates sharpness (Laplacian variance) and lighting (luminance histogram)
 * directly in the browser before sending requests to the backend.
 */
const QualityChecker = {
  // Threshold constants
  MIN_LAPLACIAN_VAR: 65,  // Below this is blurry
  MIN_LUMINANCE: 35,       // Below this is too dark
  MAX_LUMINANCE: 228,      // Above this is washed out / overexposed

  /**
   * Analyzes an ImageData or HTMLCanvasElement/Video
   * @param {HTMLCanvasElement | ImageData} source 
   * @returns {{ passed: boolean, blurPassed: boolean, lightPassed: boolean, code: string, messageKey: string }}
   */
  analyze(source) {
    let ctx, width, height, imgData;

    if (source instanceof ImageData) {
      imgData = source;
      width = imgData.width;
      height = imgData.height;
    } else {
      const canvas = document.createElement("canvas");
      // Downscale to 120x120 for real-time 60fps performance
      canvas.width = 120;
      canvas.height = 120;
      ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(source, 0, 0, 120, 120);
      imgData = ctx.getImageData(0, 0, 120, 120);
      width = 120;
      height = 120;
    }

    const data = imgData.data;
    const gray = new Float32Array(width * height);
    let totalLum = 0;

    // Convert to grayscale & compute mean luminance
    for (let i = 0, j = 0; i < data.length; i += 4, j++) {
      // Standard Rec. 601 luma weights
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      gray[j] = lum;
      totalLum += lum;
    }

    const meanLuminance = totalLum / (width * height);

    // 1. Light check
    if (meanLuminance < this.MIN_LUMINANCE) {
      return {
        passed: false,
        blurPassed: true,
        lightPassed: false,
        code: "dark",
        meanLuminance,
        messageKey: "quality_dark"
      };
    }

    if (meanLuminance > this.MAX_LUMINANCE) {
      return {
        passed: false,
        blurPassed: true,
        lightPassed: false,
        code: "overexposed",
        meanLuminance,
        messageKey: "quality_overexposed"
      };
    }

    // 2. Blur Check: Discrete 2D Laplacian operator
    // Kernel:
    // [ 0  1  0 ]
    // [ 1 -4  1 ]
    // [ 0  1  0 ]
    let lapSum = 0;
    let lapSumSq = 0;
    let count = 0;

    for (let y = 1; y < height - 1; y++) {
      const rowOffset = y * width;
      const prevRow = (y - 1) * width;
      const nextRow = (y + 1) * width;

      for (let x = 1; x < width - 1; x++) {
        const center = gray[rowOffset + x];
        const lap = (
          gray[prevRow + x] +
          gray[nextRow + x] +
          gray[rowOffset + x - 1] +
          gray[rowOffset + x + 1] -
          4 * center
        );

        lapSum += lap;
        lapSumSq += lap * lap;
        count++;
      }
    }

    const lapMean = lapSum / count;
    const lapVariance = (lapSumSq / count) - (lapMean * lapMean);

    if (lapVariance < this.MIN_LAPLACIAN_VAR) {
      return {
        passed: false,
        blurPassed: false,
        lightPassed: true,
        code: "blurry",
        lapVariance,
        messageKey: "quality_blurry"
      };
    }

    return {
      passed: true,
      blurPassed: true,
      lightPassed: true,
      code: "good",
      meanLuminance,
      lapVariance,
      messageKey: "quality_good"
    };
  }
};
