type YMatrix = Array<Array<number>>;
type CbMatrix = Array<Array<number>>;
type CrMatrix = Array<Array<number>>;

function dct(
  cbMatrix: CbMatrix,
  crMatrix: CrMatrix,
  yMatrix: YMatrix
): {
  CbMatrixDct: CbMatrix;
  CrMatrixDCT: CrMatrix;
  YMatrixDCT: YMatrix;
} {
  const CbMatrixDct = Array.from({ length: 128 }, () => Array.from({ length: 128 }, () => 0));
  const CrMatrixDCT = Array.from({ length: 128 }, () => Array.from({ length: 128 }, () => 0));
  const YMatrixDCT = Array.from({ length: 256 }, () => Array.from({ length: 256 }, () => 0));

  for (let yb = 0; yb < cbMatrix.length; yb += 8) {
    for (let xb = 0; xb < cbMatrix.length; xb += 8) {
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          let sum = 0;
          const Ci = x === 0 ? 1 / Math.sqrt(2) : 1;
          const Cj = y === 0 ? 1 / Math.sqrt(2) : 1;
          for (let u = 0; u < 8; u++) {
            for (let v = 0; v < 8; v++) {
              sum +=
                cbMatrix[yb + u][xb + v] *
                Math.cos(((2 * x + 1) * u * Math.PI) / 16) *
                Math.cos(((2 * y + 1) * v * Math.PI) / 16);
            }
          }

          CbMatrixDct[yb + y][xb + x] = (1 / 4) * Ci * Cj * sum;
        }
      }
    }
  }

  for (let yb = 0; yb < crMatrix.length; yb += 8) {
    for (let xb = 0; xb < crMatrix.length; xb += 8) {
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          let sum = 0;
          const Ci = x === 0 ? 1 / Math.sqrt(2) : 1;
          const Cj = y === 0 ? 1 / Math.sqrt(2) : 1;
          for (let u = 0; u < 8; u++) {
            for (let v = 0; v < 8; v++) {
              sum +=
                crMatrix[yb + u][xb + v] *
                Math.cos(((2 * x + 1) * u * Math.PI) / 16) *
                Math.cos(((2 * y + 1) * v * Math.PI) / 16);
            }
          }
          CrMatrixDCT[yb + y][xb + x] = (1 / 4) * Ci * Cj * sum;
        }
      }
    }
  }

  for (let yb = 0; yb < yMatrix.length; yb += 8) {
    for (let xb = 0; xb < yMatrix.length; xb += 8) {
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          let sum = 0;
          const Ci = x === 0 ? 1 / Math.sqrt(2) : 1;
          const Cj = y === 0 ? 1 / Math.sqrt(2) : 1;
          for (let u = 0; u < 8; u++) {
            for (let v = 0; v < 8; v++) {
              sum +=
                yMatrix[yb + u][xb + v] *
                Math.cos(((2 * x + 1) * u * Math.PI) / 16) *
                Math.cos(((2 * y + 1) * v * Math.PI) / 16);
            }
          }
          YMatrixDCT[yb + y][xb + x] = (1 / 4) * Ci * Cj * sum;
        }
      }
    }
  }

  return { CbMatrixDct, CrMatrixDCT, YMatrixDCT };
}

function inverseDct(
  cbMatrix: CbMatrix,
  crMatrix: CrMatrix,
  yMatrix: YMatrix
): {
  CbMatrixIDct: CbMatrix;
  CrMatrixIDct: CrMatrix;
  YMatrixIDct: YMatrix;
} {
  const CbMatrixIDct = Array.from({ length: 128 }, () => Array.from({ length: 128 }, () => 0));
  const CrMatrixIDct = Array.from({ length: 128 }, () => Array.from({ length: 128 }, () => 0));
  const YMatrixIDct = Array.from({ length: 256 }, () => Array.from({ length: 256 }, () => 0));

  for (let yb = 0; yb < cbMatrix.length; yb += 8) {
    for (let xb = 0; xb < cbMatrix.length; xb += 8) {
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          let sum = 0;
          for (let u = 0; u < 8; u++) {
            for (let v = 0; v < 8; v++) {
              const Ci = x === 0 ? 1 / Math.sqrt(2) : 1;
              const Cj = y === 0 ? 1 / Math.sqrt(2) : 1;
              sum +=
                cbMatrix[yb + u][xb + v] *
                Math.cos(((2 * x + 1) * u * Math.PI) / 16) *
                Math.cos(((2 * y + 1) * v * Math.PI) / 16) *
                Ci *
                Cj;
            }
          }
          CbMatrixIDct[yb + y][xb + x] = (1 / 4) * sum;
        }
      }
    }
  }

  for (let yb = 0; yb < crMatrix.length; yb += 8) {
    for (let xb = 0; xb < crMatrix.length; xb += 8) {
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          let sum = 0;
          for (let u = 0; u < 8; u++) {
            for (let v = 0; v < 8; v++) {
              const Ci = x === 0 ? 1 / Math.sqrt(2) : 1;
              const Cj = y === 0 ? 1 / Math.sqrt(2) : 1;
              sum +=
                crMatrix[yb + u][xb + v] *
                Math.cos(((2 * x + 1) * u * Math.PI) / 16) *
                Math.cos(((2 * y + 1) * v * Math.PI) / 16) *
                Ci *
                Cj;
            }
          }
          CrMatrixIDct[yb + y][xb + x] = (1 / 4) * sum;
        }
      }
    }
  }

  for (let yb = 0; yb < yMatrix.length; yb += 8) {
    for (let xb = 0; xb < yMatrix.length; xb += 8) {
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          let sum = 0;
          for (let u = 0; u < 8; u++) {
            for (let v = 0; v < 8; v++) {
              const Ci = x === 0 ? 1 / Math.sqrt(2) : 1;
              const Cj = y === 0 ? 1 / Math.sqrt(2) : 1;
              sum +=
                yMatrix[yb + u][xb + v] *
                Math.cos(((2 * x + 1) * u * Math.PI) / 16) *
                Math.cos(((2 * y + 1) * v * Math.PI) / 16) *
                Ci *
                Cj;
            }
          }
          YMatrixIDct[yb + y][xb + x] = (1 / 4) * sum;
        }
      }
    }
  }

  return { CbMatrixIDct, CrMatrixIDct, YMatrixIDct };
}

export { dct, inverseDct };
