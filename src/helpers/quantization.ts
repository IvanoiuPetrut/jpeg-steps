type YMatrix = Array<Array<number>>;
type CbMatrix = Array<Array<number>>;
type CrMatrix = Array<Array<number>>;

function simpleMatrix(
  CbMatrixDct: CbMatrix,
  CrMatrixDCT: CrMatrix,
  YMatrixDCT: YMatrix,
  r: number
) {
  const CbMatrixQuant = Array.from({ length: 128 }, () => Array.from({ length: 128 }, () => 0));
  const CrMatrixQuant = Array.from({ length: 128 }, () => Array.from({ length: 128 }, () => 0));
  const YMatrixQuant = Array.from({ length: 256 }, () => Array.from({ length: 256 }, () => 0));
  for (let yb = 0; yb < CbMatrixDct.length; yb += 8) {
    for (let xb = 0; xb < CbMatrixDct.length; xb += 8) {
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          CbMatrixQuant[yb + y][xb + x] = Math.round(1 + (x + y) * r);
        }
      }
    }
  }

  for (let yb = 0; yb < CrMatrixDCT.length; yb += 8) {
    for (let xb = 0; xb < CrMatrixDCT.length; xb += 8) {
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          CrMatrixQuant[yb + y][xb + x] = Math.round(1 + (x + y) * r);
        }
      }
    }
  }

  for (let yb = 0; yb < YMatrixDCT.length; yb += 8) {
    for (let xb = 0; xb < YMatrixDCT.length; xb += 8) {
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          YMatrixQuant[yb + y][xb + x] = Math.round(1 + (x + y) * r);
        }
      }
    }
  }

  return { CbMatrixQuant, CrMatrixQuant, YMatrixQuant };
}

function inverseSimpleMatrix(
  CbMatrixQuant: CbMatrix,
  CrMatrixQuant: CrMatrix,
  YMatrixQuant: YMatrix,
  r: number
): {
  CbMatrixDctFromQuant: CbMatrix;
  CrMatrixDCTFromQuant: CrMatrix;
  YMatrixDCTFromQuant: YMatrix;
} {
  const CbMatrixDctFromQuant = Array.from({ length: 128 }, () =>
    Array.from({ length: 128 }, () => 0)
  );
  const CrMatrixDCTFromQuant = Array.from({ length: 128 }, () =>
    Array.from({ length: 128 }, () => 0)
  );
  const YMatrixDCTFromQuant = Array.from({ length: 256 }, () =>
    Array.from({ length: 256 }, () => 0)
  );

  for (let yb = 0; yb < CbMatrixQuant.length; yb += 8) {
    for (let xb = 0; xb < CbMatrixQuant.length; xb += 8) {
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          const quantizationFactor = 1 + (x + y) * r;
          const inverseQuantizationFactor = 1 / quantizationFactor;
          CbMatrixDctFromQuant[yb + y][xb + x] = Math.round(
            CbMatrixQuant[yb + y][xb + x] * inverseQuantizationFactor
          );
        }
      }
    }
  }

  for (let yb = 0; yb < CrMatrixQuant.length; yb += 8) {
    for (let xb = 0; xb < CrMatrixQuant.length; xb += 8) {
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          const quantizationFactor = 1 + (x + y) * r;
          const inverseQuantizationFactor = 1 / quantizationFactor;
          CrMatrixDCTFromQuant[yb + y][xb + x] = Math.round(
            CrMatrixQuant[yb + y][xb + x] * inverseQuantizationFactor
          );
        }
      }
    }
  }

  for (let yb = 0; yb < YMatrixQuant.length; yb += 8) {
    for (let xb = 0; xb < YMatrixQuant.length; xb += 8) {
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          const quantizationFactor = 1 + (x + y) * r;
          const inverseQuantizationFactor = 1 / quantizationFactor;
          YMatrixDCTFromQuant[yb + y][xb + x] = Math.round(
            YMatrixQuant[yb + y][xb + x] * inverseQuantizationFactor
          );
        }
      }
    }
  }

  return { CbMatrixDctFromQuant, CrMatrixDCTFromQuant, YMatrixDCTFromQuant };
}

function eliminateCoeficients(cbMatrix: CbMatrix, crMatrix: CrMatrix, yMatrix: YMatrix, n: number) {
  const CbMatrixQuant = Array.from({ length: 128 }, () => Array.from({ length: 128 }, () => 0));
  const CrMatrixQuant = Array.from({ length: 128 }, () => Array.from({ length: 128 }, () => 0));
  const YMatrixQuant = Array.from({ length: 256 }, () => Array.from({ length: 256 }, () => 0));

  const zigzagOrder = [
    [0, 0],
    [0, 1],
    [1, 0],
    [2, 0],
    [1, 1],
    [0, 2],
    [0, 3],
    [1, 2],
    [2, 1],
    [3, 0],
    [4, 0],
    [3, 1],
    [2, 2],
    [1, 3],
    [0, 4],
    [0, 5],
    [1, 4],
    [2, 3],
    [3, 2],
    [4, 1],
    [5, 0],
    [6, 0],
    [5, 1],
    [4, 2],
    [3, 3],
    [2, 4],
    [1, 5],
    [0, 6],
    [0, 7],
    [1, 6],
    [2, 5],
    [3, 4],
    [4, 3],
    [5, 2],
    [6, 1],
    [7, 0],
    [7, 1],
    [6, 2],
    [5, 3],
    [4, 4],
    [3, 5],
    [2, 6],
    [1, 7],
    [2, 7],
    [3, 6],
    [4, 5],
    [5, 4],
    [6, 3],
    [7, 2],
    [7, 3],
    [6, 4],
    [5, 5],
    [4, 6],
    [3, 7],
    [4, 7],
    [5, 6],
    [6, 5],
    [7, 4],
    [7, 5],
    [6, 6],
    [5, 7],
    [6, 7],
    [7, 6],
    [7, 7]
  ];

  for (let yb = 0; yb < 256; yb += 8) {
    for (let xb = 0; xb < 256; xb += 8) {
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          const [x, y] = zigzagOrder[i * 8 + j];
          if (x + y < n) {
            YMatrixQuant[yb + i][xb + j] = yMatrix[yb + i][xb + j];
          }
          // YMatrixQuant[0 + yb][0 + xb] = yMatrix[0 + yb][0 + xb];
          // YMatrixQuant[0 + yb][1 + xb] = yMatrix[0 + yb][1 + xb];
          // YMatrixQuant[1 + yb][0 + xb] = yMatrix[1 + yb][0 + xb];
          // YMatrixQuant[2 + yb][0 + xb] = yMatrix[2 + yb][0 + xb];
          // YMatrixQuant[1 + yb][1 + xb] = yMatrix[1 + yb][1 + xb];
          // YMatrixQuant[0 + yb][2 + xb] = yMatrix[0 + yb][2 + xb];
          // YMatrixQuant[0 + yb][3 + xb] = yMatrix[0 + yb][3 + xb];
        }
      }
    }
  }

  for (let yb = 0; yb < 128; yb += 8) {
    for (let xb = 0; xb < 128; xb += 8) {
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          const [x, y] = zigzagOrder[i * 8 + j];
          if (x + y < n) {
            CbMatrixQuant[yb + i][xb + j] = cbMatrix[yb + i][xb + j];
          }
          // CbMatrixQuant[0 + yb][0 + xb] = cbMatrix[0 + yb][0 + xb];
          // CbMatrixQuant[0 + yb][1 + xb] = cbMatrix[0 + yb][1 + xb];
          // CbMatrixQuant[1 + yb][0 + xb] = cbMatrix[1 + yb][0 + xb];
          // CbMatrixQuant[2 + yb][0 + xb] = cbMatrix[2 + yb][0 + xb];
          // CbMatrixQuant[1 + yb][1 + xb] = cbMatrix[1 + yb][1 + xb];
          // CbMatrixQuant[0 + yb][2 + xb] = cbMatrix[0 + yb][2 + xb];
          // CbMatrixQuant[0 + yb][3 + xb] = cbMatrix[0 + yb][3 + xb];
        }
      }
    }
  }

  for (let yb = 0; yb < 128; yb += 8) {
    for (let xb = 0; xb < 128; xb += 8) {
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          const [x, y] = zigzagOrder[i * 8 + j];
          if (x + y < n) {
            CrMatrixQuant[yb + i][xb + j] = crMatrix[yb + i][xb + j];
          }
          // CrMatrixQuant[0 + yb][0 + xb] = crMatrix[0 + yb][0 + xb];
          // CrMatrixQuant[0 + yb][1 + xb] = crMatrix[0 + yb][1 + xb];
          // CrMatrixQuant[1 + yb][0 + xb] = crMatrix[1 + yb][0 + xb];
          // CrMatrixQuant[2 + yb][0 + xb] = crMatrix[2 + yb][0 + xb];
          // CrMatrixQuant[1 + yb][1 + xb] = crMatrix[1 + yb][1 + xb];
          // CrMatrixQuant[0 + yb][2 + xb] = crMatrix[0 + yb][2 + xb];
          // CrMatrixQuant[0 + yb][3 + xb] = crMatrix[0 + yb][3 + xb];
        }
      }
    }
  }

  return { CbMatrixQuant, CrMatrixQuant, YMatrixQuant };
}

export { eliminateCoeficients };
