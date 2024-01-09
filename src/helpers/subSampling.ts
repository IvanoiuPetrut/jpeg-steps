type YCbCrMatrix = Array<Array<[number, number, number]>>;
type YMatrix = Array<Array<number>>;
type CbMatrix = Array<Array<number>>;
type CrMatrix = Array<Array<number>>;

function mapToMatrix(imageData: ImageData): YCbCrMatrix {
  const { data } = imageData;
  const matrix: YCbCrMatrix = Array.from({ length: imageData.height }, () =>
    Array.from({ length: imageData.width }, () => [0, 0, 0])
  );

  for (let i = 0; i < data.length; i += 4) {
    const y = data[i];
    const cb = data[i + 1];
    const cr = data[i + 2];
    const row = Math.floor(i / (imageData.width * 4));
    const col = Math.floor((i % (imageData.width * 4)) / 4);

    matrix[row][col] = [y, cb, cr];
  }
  return matrix;
}

function subSampling(imageData: ImageData): {
  cbMatrix: CbMatrix;
  crMatrix: CrMatrix;
  yMatrix: YMatrix;
} {
  const matrix = mapToMatrix(imageData);
  const yMatrix: YMatrix = Array.from({ length: imageData.height }, () =>
    Array.from({ length: imageData.width }, () => 0)
  );
  const cbMatrix: CbMatrix = Array.from({ length: imageData.height / 2 }, () =>
    Array.from({ length: imageData.width / 2 }, () => 0)
  );
  const crMatrix: CrMatrix = Array.from({ length: imageData.height / 2 }, () =>
    Array.from({ length: imageData.width / 2 }, () => 0)
  );

  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix.length; j++) {
      yMatrix[i][j] = matrix[i][j][0];
    }
  }

  for (let i = 0; i < matrix.length; i += 2) {
    for (let j = 0; j < matrix.length; j += 2) {
      const firstRowFirstCol = matrix[i][j];
      const firstRowSecondCol = matrix[i][j + 1];
      const secondRowFirstCol = matrix[i + 1][j];
      const secondRowSecondCol = matrix[i + 1][j + 1];

      const cb =
        (firstRowFirstCol[1] +
          firstRowSecondCol[1] +
          secondRowFirstCol[1] +
          secondRowSecondCol[1]) /
        4;
      const cr =
        (firstRowFirstCol[2] +
          firstRowSecondCol[2] +
          secondRowFirstCol[2] +
          secondRowSecondCol[2]) /
        4;

      cbMatrix[i / 2][j / 2] = Math.round(cb);
      crMatrix[i / 2][j / 2] = Math.round(cr);
    }
  }

  return { cbMatrix, crMatrix, yMatrix };
}

function clampToByte(value: number): number {
  if (value < 0) {
    return 0;
  }
  if (value > 255) {
    return 255;
  }
  return Math.round(value);
}

function inverseSubSampling(cbMatrix: CbMatrix, crMatrix: CrMatrix, yMatrix: YMatrix): YCbCrMatrix {
  const matrix: YCbCrMatrix = Array.from({ length: yMatrix.length }, () =>
    Array.from({ length: yMatrix.length }, () => [0, 0, 0])
  );

  for (let i = 0; i < 256; i++) {
    for (let j = 0; j < 256; j++) {
      matrix[i][j][0] = clampToByte(yMatrix[i][j]);
    }
  }

  for (let i = 0; i < 256; i++) {
    for (let j = 0; j < 256; j++) {
      const cbValue = clampToByte(cbMatrix[Math.floor(i / 2)][Math.floor(j / 2)]);
      const crValue = clampToByte(crMatrix[Math.floor(i / 2)][Math.floor(j / 2)]);
      matrix[i][j][1] = cbValue;
      matrix[i][j][2] = crValue;
    }
  }

  return matrix;
}

export { subSampling, inverseSubSampling };
