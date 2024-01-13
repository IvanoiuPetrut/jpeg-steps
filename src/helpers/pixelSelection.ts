function get8x8Matrix(matrix: number[][], x: number, y: number): number[][] {
  const matrix8x8: number[][] = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => 0));

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      matrix8x8[i][j] = matrix[x + i][y + j];
    }
  }

  return matrix8x8;
}

function getPixelBlock(imageData: ImageData, x: number, y: number): number[][][] {
  const block: number[][][] = Array.from({ length: 8 }, () =>
    Array.from({ length: 8 }, () => [0, 0, 0])
  );

  const imageWidth = imageData.width;
  for (let i = 0; i < 8; i++) {
    const row = y + i;
    for (let j = 0; j < 8; j++) {
      const col = x + j;
      const index = (row * imageWidth + col) * 4;
      block[i][j][0] = imageData.data[index];
      block[i][j][1] = imageData.data[index + 1];
      block[i][j][2] = imageData.data[index + 2];
    }
  }

  return block;
}

function mapZoomBlockToImageData(block: number[][][]): ImageData {
  const upscaleFactor = 8;
  const imageData = new ImageData(64, 64);

  for (let i = 0; i < imageData.height; i++) {
    for (let j = 0; j < imageData.width; j++) {
      const originalRowIndex = Math.floor(i / upscaleFactor);
      const originalColIndex = Math.floor(j / upscaleFactor);

      const index = (i * imageData.width + j) * 4;
      imageData.data[index] = block[originalRowIndex][originalColIndex][0];
      imageData.data[index + 1] = block[originalRowIndex][originalColIndex][1];
      imageData.data[index + 2] = block[originalRowIndex][originalColIndex][2];
      imageData.data[index + 3] = 255;
    }
  }

  return imageData;
}

// function mapZoomBlockToImageData(block: number[][][]): ImageData {
//   const imageData = new ImageData(8, 8);
//   for (let i = 0; i < block.length; i++) {
//     for (let j = 0; j < block.length; j++) {
//       const index = (i * 8 + j) * 4;
//       imageData.data[index] = block[i][j][0];
//       imageData.data[index + 1] = block[i][j][1];
//       imageData.data[index + 2] = block[i][j][2];
//       imageData.data[index + 3] = 255;
//     }
//   }

//   return imageData;
// }

// function mapZoomBlockToImageData(block: number[][][]): ImageData {
//   const upscaleFactor = 8; // Upscale factor from 8x8 to 64x64
//   const imageData = new ImageData(64, 64);

//   for (let i = 0; i < imageData.height; i++) {
//     for (let j = 0; j < imageData.width; j++) {
//       const originalRowIndex = Math.floor(i / upscaleFactor);
//       const originalColIndex = Math.floor(j / upscaleFactor);

//       const index = (i * imageData.width + j) * 4;
//       imageData.data[index] = block[originalRowIndex][originalColIndex][0];
//       imageData.data[index + 1] = block[originalRowIndex][originalColIndex][1];
//       imageData.data[index + 2] = block[originalRowIndex][originalColIndex][2];
//       imageData.data[index + 3] = 255;
//     }
//   }

//   return imageData;
// }

export { get8x8Matrix, getPixelBlock, mapZoomBlockToImageData };
