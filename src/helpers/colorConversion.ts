function rgbToYCbCr(imageData: ImageData) {
  const { data } = imageData;
  const yCbCrData = new Uint8ClampedArray(data.length);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const y = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    const cb = Math.round(-0.1687 * r - 0.3313 * g + 0.5 * b + 128);
    const cr = Math.round(0.5 * r - 0.4187 * g - 0.0813 * b + 128);

    yCbCrData[i] = y;
    yCbCrData[i + 1] = cb;
    yCbCrData[i + 2] = cr;
    yCbCrData[i + 3] = data[i + 3];
  }

  return new ImageData(yCbCrData, imageData.width, imageData.height);
}

function yCbCrToRgb(imageData: ImageData) {
  const { data } = imageData;
  const rgbData = new Uint8ClampedArray(data.length);

  for (let i = 0; i < data.length; i += 4) {
    const y = data[i];
    const cb = data[i + 1];
    const cr = data[i + 2];

    const r = Math.round(y + 1.402 * (cr - 128));
    const g = Math.round(y - 0.34414 * (cb - 128) - 0.71414 * (cr - 128));
    const b = Math.round(y + 1.772 * (cb - 128));

    rgbData[i] = r;
    rgbData[i + 1] = g;
    rgbData[i + 2] = b;
    rgbData[i + 3] = data[i + 3];
  }
  return new ImageData(rgbData, imageData.width, imageData.height);
}

export { rgbToYCbCr, yCbCrToRgb };
