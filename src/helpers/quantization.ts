type YMatrix = Array<Array<number>>;
type CbMatrix = Array<Array<number>>;
type CrMatrix = Array<Array<number>>;

function quantization(CbMatrixDct: CbMatrix, CrMatrixDCT: CrMatrix, YMatrixDCT: YMatrix) {
  const CbMatrixQuant = Array.from({ length: 128 }, () => Array.from({ length: 128 }, () => 0));
  const CrMatrixQuant = Array.from({ length: 128 }, () => Array.from({ length: 128 }, () => 0));
  const YMatrixQuant = Array.from({ length: 256 }, () => Array.from({ length: 256 }, () => 0));
  for (let yb = 0; yb < CbMatrixDct.length; yb += 8) {
    for (let xb = 0; xb < CbMatrixDct.length; xb += 8) {
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          //Qxy = 1 + (x + y) * R    | R >= 0
          const r = 100;
          CbMatrixQuant[yb + y][xb + x] = Math.round(1 + (x + y) * r);
        }
      }
    }
  }

  for (let yb = 0; yb < CrMatrixDCT.length; yb += 8) {
    for (let xb = 0; xb < CrMatrixDCT.length; xb += 8) {
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          //Qxy = 1 + (x + y) * R    | R >= 0
          const r = 100;
          CrMatrixQuant[yb + y][xb + x] = Math.round(1 + (x + y) * r);
        }
      }
    }
  }

  for (let yb = 0; yb < YMatrixDCT.length; yb += 8) {
    for (let xb = 0; xb < YMatrixDCT.length; xb += 8) {
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          //Qxy = 1 + (x + y) * R    | R >= 0
          const r = 100;
          YMatrixQuant[yb + y][xb + x] = Math.round(1 + (x + y) * r);
        }
      }
    }
  }

  return { CbMatrixQuant, CrMatrixQuant, YMatrixQuant };
}

function inverseQuantization(
  CbMatrixQuant: CbMatrix,
  CrMatrixQuant: CrMatrix,
  YMatrixQuant: YMatrix
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
          //Qxy = 1 + (x + y) * R    | R >= 0
          const r = 100;
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
          //Qxy = 1 + (x + y) * R    | R >= 0
          const r = 100;
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
          //Qxy = 1 + (x + y) * R    | R >= 0
          const r = 100;
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

  for (let yb = 0; yb < 256; yb += 8) {
    for (let xb = 0; xb < 256; xb += 8) {
      const rows = 8,
        cols = 8;
      let numberOfKeptCoeficients = 0;
      for (let i = 0; i < rows; i++) {
        if (i % 2 === 0) {
          // Even rows: left to right
          for (let j = 0; j < cols; j++) {
            if (numberOfKeptCoeficients < n) {
              YMatrixQuant[yb + i][xb + j] = yMatrix[yb + i][xb + j];
              numberOfKeptCoeficients++;
            }
          }
        } else {
          // Odd rows: right to left
          for (let j = cols - 1; j >= 0; j--) {
            if (numberOfKeptCoeficients < n) {
              YMatrixQuant[yb + i][xb + j] = yMatrix[yb + i][xb + j];
              numberOfKeptCoeficients++;
            }
          }
        }
      }
    }
  }

  for (let yb = 0; yb < 128; yb += 8) {
    for (let xb = 0; xb < 128; xb += 8) {
      const rows = 8,
        cols = 8;
      let numberOfKeptCoeficients = 0;
      for (let i = 0; i < rows; i++) {
        if (i % 2 === 0) {
          // Even rows: left to right
          for (let j = 0; j < cols; j++) {
            if (numberOfKeptCoeficients < n) {
              CbMatrixQuant[yb + i][xb + j] = cbMatrix[yb + i][xb + j];
              CrMatrixQuant[yb + i][xb + j] = crMatrix[yb + i][xb + j];
              numberOfKeptCoeficients++;
            }
          }
        } else {
          // Odd rows: right to left
          for (let j = cols - 1; j >= 0; j--) {
            if (numberOfKeptCoeficients < n) {
              CbMatrixQuant[yb + i][xb + j] = cbMatrix[yb + i][xb + j];
              CrMatrixQuant[yb + i][xb + j] = crMatrix[yb + i][xb + j];
              numberOfKeptCoeficients++;
            }
          }
        }
      }
    }
  }

  return { CbMatrixQuant, CrMatrixQuant, YMatrixQuant };
}

export { eliminateCoeficients };
