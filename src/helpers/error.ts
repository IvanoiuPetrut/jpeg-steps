function computePsnrAndMse(originalImageData: ImageData, reconstructedImageData: ImageData) {
  const originalData = originalImageData.data;
  const reconstructedData = reconstructedImageData.data;

  let mse = 0;
  for (let i = 0; i < originalData.length; i += 4) {
    mse +=
      Math.pow(originalData[i] - reconstructedData[i], 2) +
      Math.pow(originalData[i + 1] - reconstructedData[i + 1], 2) +
      Math.pow(originalData[i + 2] - reconstructedData[i + 2], 2);
  }

  mse = mse / (256 * 256);

  const psnr = 10 * Math.log10(Math.pow(255, 2) / mse);

  return [psnr, mse];
}

function computeErrorImage(
  originalImageData: ImageData,
  reconstructedImageData: ImageData,
  contrastFactor: number
) {
  const originalData = originalImageData.data;
  const reconstructedData = reconstructedImageData.data;

  const errorImageData = new ImageData(originalImageData.width, originalImageData.height);

  for (let i = 0; i < originalData.length; i += 4) {
    errorImageData.data[i] = originalData[i] - reconstructedData[i] * contrastFactor + 128;
    errorImageData.data[i + 1] =
      originalData[i + 1] - reconstructedData[i + 1] * contrastFactor + 128;
    errorImageData.data[i + 2] =
      originalData[i + 2] - reconstructedData[i + 2] * contrastFactor + 128;
    errorImageData.data[i + 3] = 255;
  }

  return errorImageData;
}

export { computeErrorImage, computePsnrAndMse };
