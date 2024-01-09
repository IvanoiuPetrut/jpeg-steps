<script setup lang="ts">
import { ref } from "vue";
import TableItem from "./components/TableItem.vue";
import { rgbToYCbCr, yCbCrToRgb } from "./helpers/colorConversion";
import { subSampling, inverseSubSampling } from "./helpers/subSampling";
import { dct, inverseDct } from "./helpers/dct";
import { eliminateCoeficients } from "./helpers/quantization";
import { computeErrorImage, computePsnrAndMse } from "./helpers/error";
import { getPixelBlock, mapZoomBlockToImageData, get8x8Matrix } from "./helpers/pixelSelection";

type YCbCrMatrix = Array<Array<[number, number, number]>>;
type YMatrix = Array<Array<number>>;
type CbMatrix = Array<Array<number>>;
type CrMatrix = Array<Array<number>>;
type CbMatrixQuant = Array<Array<number>>;
type CrMatrixQuant = Array<Array<number>>;
type YMatrixQuant = Array<Array<number>>;

enum Method {
  Elimination = "1",
  SimpleMatrix = "2",
  QualityJpgeFactor = "3"
}

const originalImgUrl = ref<string>("");
const yCbCrImgUrl = ref<string>("");
const subSampledImgUrl = ref<string>("");
const dctImgUrl = ref<string>("");
const quantImgUrl = ref<string>("");

const inverseSubSampledImgUrl = ref<string>("");
const inverseDctImgUrl = ref<string>("");

const reconstructedImgUrl = ref<string>("");
const errorImgUrl = ref<string>("");

const zoomImageOriginalUrl = ref<string>("");
const zoomImageReconstructedUrl = ref<string>("");

const eliminationCount = ref<string>("1");
const simpleMatrixCount = ref<string>("1");
const jpqgFactor = ref<string>("1");
const contrastFactor = ref<string>("1");

const yOriginalMatrix8x8 = ref<YMatrix | null>(null);
const yReconstructedMatrix8x8 = ref<YMatrix | null>(null);
const yQuantMatrix8x8 = ref<YMatrix | null>(null);
const yDctMatrix8x8 = ref<YMatrix | null>(null);

const selectedMethod = ref<Method>(Method.Elimination);

const psnr = ref<number>(0);
const mse = ref<number>(0);

let CbMatrixQuantGlobal: CbMatrixQuant,
  CrMatrixQuantGlobal: CrMatrixQuant,
  YMatrixQuantGlobal: YMatrixQuant;

let CbMatrixDctGlobal: CbMatrix, CrMatrixDctGlobal: CrMatrix, YMatrixDctGlobal: YMatrix;

let yMatrixOriginalGlobal: YMatrix;
let yMatrixReconstructedGlobal: YMatrix;

const originalImage = ref<HTMLImageElement | null>(null);
const reconstructedImage = ref<HTMLImageElement | null>(null);

function onFileChange(e: Event) {
  const file = e.target?.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      let iamgeUrl = e.target?.result;
      originalImgUrl.value = iamgeUrl as string;
    };
    reader.readAsDataURL(file);
  }
}

function getImageData(img: HTMLImageElement): ImageData | undefined {
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;

  const ctx = canvas.getContext("2d");
  ctx?.drawImage(img, 0, 0);

  return ctx?.getImageData(0, 0, img.width, img.height);
}

function getImageUrl(imageData: ImageData): string {
  const canvas = document.createElement("canvas");
  canvas.width = imageData.width;
  canvas.height = imageData.height;

  const ctx = canvas.getContext("2d");
  ctx?.putImageData(imageData, 0, 0);

  return canvas.toDataURL();
}

function mapToImageData(matrix: YCbCrMatrix): ImageData {
  const imageData = new ImageData(matrix.length, matrix.length);
  const { data } = imageData;

  for (let i = 0; i < data.length; i += 4) {
    const row = Math.floor(i / (imageData.width * 4));
    const col = Math.floor((i % (imageData.width * 4)) / 4);

    data[i] = matrix[row][col][0];
    data[i + 1] = matrix[row][col][1];
    data[i + 2] = matrix[row][col][2];
    data[i + 3] = 255;
  }

  return imageData;
}

function getYmatrixFromImageData(imageData: ImageData): YMatrix {
  const matrix: YMatrix = Array.from({ length: imageData.height }, () =>
    Array.from({ length: imageData.width }, () => 0)
  );

  for (let i = 0; i < imageData.data.length; i += 4) {
    const y = imageData.data[i];
    const row = Math.floor(i / (imageData.width * 4));
    const col = Math.floor((i % (imageData.width * 4)) / 4);

    matrix[row][col] = y;
  }
  return matrix;
}

function step1234(): void {
  const imageData = getImageData(originalImage.value as HTMLImageElement);
  if (!imageData) {
    return;
  }

  yMatrixOriginalGlobal = getYmatrixFromImageData(imageData);

  const yCbCrData = rgbToYCbCr(imageData);
  yCbCrImgUrl.value = getImageUrl(yCbCrData);

  const {
    cbMatrix: cbMatrixSub,
    crMatrix: crMatrixSub,
    yMatrix: yMatrixSub
  } = subSampling(yCbCrData);
  subSampledImgUrl.value = getImageUrl(
    mapToImageData(inverseSubSampling(cbMatrixSub, crMatrixSub, yMatrixSub))
  );

  const { CbMatrixDct, CrMatrixDCT, YMatrixDCT } = dct(cbMatrixSub, crMatrixSub, yMatrixSub);
  dctImgUrl.value = getImageUrl(
    mapToImageData(inverseSubSampling(CbMatrixDct, CrMatrixDCT, YMatrixDCT))
  );

  CbMatrixDctGlobal = CbMatrixDct;
  CrMatrixDctGlobal = CrMatrixDCT;
  YMatrixDctGlobal = YMatrixDCT;
}

function step4321(): void {
  if (!CbMatrixDctGlobal || !CrMatrixDctGlobal || !YMatrixDctGlobal) {
    return;
  }

  if (selectedMethod.value === Method.Elimination) {
    const { CbMatrixQuant, CrMatrixQuant, YMatrixQuant } = eliminateCoeficients(
      CbMatrixDctGlobal,
      CrMatrixDctGlobal,
      YMatrixDctGlobal,
      Number(eliminationCount.value)
    );
    CbMatrixQuantGlobal = CbMatrixQuant;
    CrMatrixQuantGlobal = CrMatrixQuant;
    YMatrixQuantGlobal = YMatrixQuant;

    quantImgUrl.value = getImageUrl(
      mapToImageData(inverseSubSampling(CbMatrixQuant, CrMatrixQuant, YMatrixQuant))
    );
  }

  if (selectedMethod.value === Method.QualityJpgeFactor) {
    console.log("jpqgFactor", jpqgFactor.value);
  }

  if (selectedMethod.value === Method.SimpleMatrix) {
    console.log("simpleMatrixCount", simpleMatrixCount.value);
  }

  const { CbMatrixIDct, CrMatrixIDct, YMatrixIDct } = inverseDct(
    CbMatrixQuantGlobal,
    CrMatrixQuantGlobal,
    YMatrixQuantGlobal
  );
  inverseDctImgUrl.value = getImageUrl(
    mapToImageData(inverseSubSampling(CbMatrixIDct, CrMatrixIDct, YMatrixIDct))
  );

  const matrixInversed = inverseSubSampling(CbMatrixIDct, CrMatrixIDct, YMatrixIDct);
  inverseSubSampledImgUrl.value = getImageUrl(mapToImageData(matrixInversed));

  const imageDataInversed = mapToImageData(matrixInversed);
  const imageDataRgb = yCbCrToRgb(imageDataInversed);

  yMatrixReconstructedGlobal = getYmatrixFromImageData(imageDataRgb);

  reconstructedImgUrl.value = getImageUrl(imageDataRgb);
}

function computeErrors() {
  console.log(contrastFactor.value);
  const imageDataOriginal = getImageData(originalImage.value as HTMLImageElement);
  const imageDataReconstructed = getImageData(reconstructedImage.value as HTMLImageElement);

  if (!imageDataOriginal || !imageDataReconstructed) {
    return;
  }

  const imageDataError = computeErrorImage(
    imageDataOriginal,
    imageDataReconstructed,
    Number(contrastFactor.value)
  );
  errorImgUrl.value = getImageUrl(imageDataError);

  [psnr.value, mse.value] = computePsnrAndMse(imageDataOriginal, imageDataReconstructed);
}

function displayPixel(x: number, y: number): void {
  const imageDataOriginal = getImageData(originalImage.value as HTMLImageElement);
  const imageDataReconstructed = getImageData(reconstructedImage.value as HTMLImageElement);

  if (!imageDataOriginal || !imageDataReconstructed) {
    return;
  }

  const blockOriginal = getPixelBlock(imageDataOriginal, x, y);
  const blockReconstructed = getPixelBlock(imageDataReconstructed, x, y);

  zoomImageOriginalUrl.value = getImageUrl(mapZoomBlockToImageData(blockOriginal));
  zoomImageReconstructedUrl.value = getImageUrl(mapZoomBlockToImageData(blockReconstructed));
}

function displayMatrixData(x: number, y: number) {
  yOriginalMatrix8x8.value = get8x8Matrix(yMatrixOriginalGlobal, x, y);
  yReconstructedMatrix8x8.value = get8x8Matrix(yMatrixReconstructedGlobal, x, y);
  yQuantMatrix8x8.value = get8x8Matrix(YMatrixQuantGlobal, x, y);
  yDctMatrix8x8.value = get8x8Matrix(YMatrixDctGlobal, x, y);
}

function handlePixelSelect(event: MouseEvent) {
  const x = event.offsetX;
  const y = event.offsetY;
  displayPixel(x, y);
  displayMatrixData(x, y);
}
</script>

<template>
  <div class="img-container">
    <div>
      <img :src="originalImgUrl" @click="handlePixelSelect" alt="no img" ref="originalImage" />
      <p class="text-center">Original image</p>
    </div>
    <div>
      <img :src="yCbCrImgUrl" alt="no img" />
      <p class="text-center">Step 1 - YCbCr</p>
    </div>
    <div>
      <img :src="subSampledImgUrl" alt="no img" />
      <p class="text-center">Step 2 - Subsampling</p>
    </div>
    <div>
      <img :src="dctImgUrl" alt="no img" />
      <p class="text-center">Step 3 - DCT</p>
    </div>
  </div>

  <div class="img-container">
    <div>
      <img :src="quantImgUrl" alt="no img" />
      <p class="text-center">Step 4 - Quant</p>
    </div>
    <div>
      <img :src="inverseDctImgUrl" alt="no img" />
      <p class="text-center">Step 3' - Inverse DCT</p>
    </div>
    <div>
      <img :src="inverseSubSampledImgUrl" alt="no img" />
      <p class="text-center">Step 2' - Inverse Subsampling</p>
    </div>
    <div>
      <img
        :src="reconstructedImgUrl"
        alt="no img"
        ref="reconstructedImage"
        @click="handlePixelSelect"
      />
      <p class="text-center">Step 1' - RGB</p>
    </div>
    <div class="">
      <img :src="errorImgUrl" alt="error img" />
      <div class="info-container">
        <span>Error</span>
        <span>E {{ mse.toFixed(2) }}</span>
        <span>PSNR {{ psnr.toFixed(2) }}</span>
      </div>
    </div>
  </div>

  <div class="btn-container">
    <div>
      <label for="file">Choose a file:</label>
      <input type="file" accept=".bmp" id="file" @change="onFileChange" />
    </div>
    <button @click="step1234">Direct steps (1, 2, 3)</button>
    <button @click="step4321">Inverse steps (4, 4', 3', 2', 1')</button>
    <div class="input-group">
      <button @click="computeErrors">Conpute Errors</button>
      <input type="number" class="box" v-model="contrastFactor" />
    </div>
  </div>

  <div class="method-wrapper">
    <div class="input-group">
      <input type="radio" id="1" name="step" value="1" checked v-model="selectedMethod" />
      <label for="1"
        >Elimination coeficienti
        <p>[0-63]</p></label
      >
      <input type="number" class="box" v-model="eliminationCount" />
    </div>
    <div class="input-group">
      <input type="radio" id="2" name="step" value="2" v-model="selectedMethod" />
      <label for="2"
        >Matrice simpla calculata
        <p>[R >= 0]</p></label
      >
      <input type="number" class="box" v-model="simpleMatrixCount" />
    </div>
    <div class="input-group">
      <input type="radio" id="3" name="step" value="3" v-model="selectedMethod" />
      <label for="3"
        >Factor de calitate >qJpeg
        <p>[1...100]</p>
      </label>
      <input type="number" class="box" v-model="jpqgFactor" />
    </div>
  </div>

  <div class="">
    <div style="display: flex; justify-content: space-between; gap: 1.2rem">
      <img :src="zoomImageOriginalUrl" alt="original block" width="64" height="64" />
      <img :src="zoomImageReconstructedUrl" alt="reconstructed block" width="64" height="64" />
    </div>
  </div>

  <div class="table-container">
    <TableItem
      :matrix="yOriginalMatrix8x8"
      :title="'Y Original Matrix'"
      v-if="yOriginalMatrix8x8"
    />
    <TableItem
      :matrix="yReconstructedMatrix8x8"
      :title="'Y Reconstructed Matrix'"
      v-if="yReconstructedMatrix8x8"
    />
    <TableItem :matrix="yQuantMatrix8x8" :title="'Y Quant Matrix'" v-if="yQuantMatrix8x8" />
    <TableItem :matrix="yDctMatrix8x8" :title="'Y DCT Matrix'" v-if="yDctMatrix8x8" />
  </div>
</template>

<style scoped>
img {
  display: block;
  width: 256px;
  height: 256px;
}

button {
  font-size: 1rem;
  font-weight: 500;
  padding: 0.8rem 0.8rem;
  border-radius: 7px;
  cursor: pointer;

  background-color: hsla(160, 100%, 37%, 1);
  color: #fff;
  border: 1px solid hsla(160, 100%, 37%, 0.2);

  transition: all 0.2s ease-in-out;
}

button:hover {
  background-color: hsla(160, 100%, 37%, 0.2);
  border: 1px solid hsla(160, 100%, 37%, 1);
}

.text-center {
  text-align: center;
  margin-top: 0.4rem;
  font-size: 1rem;
  font-weight: 600;
}

.img-container {
  display: flex;
  justify-content: space-between;
  gap: 2.4rem;
  grid-column: span 3;
}

.btn-container {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1.2rem;
}

.method-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  border: 1px solid hsla(160, 100%, 37%, 1);
  padding: 1.2rem;
  border-radius: 7px;
}

.method-wrapper div {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-top: 0.8rem;
}

.info-container {
  display: flex;
  justify-content: space-between;
  gap: 1.2rem;
}

.info-container span {
  font-size: 1rem;
  font-weight: 600;
}

.box {
  display: inline-block;
  padding: 0.4rem 0.8rem;
  border-radius: 7px;
  background-color: hsla(160, 100%, 37%, 0.2);
  color: hsla(160, 100%, 37%, 1);
  border: 1px solid hsla(160, 100%, 37%, 0.2);
  font-weight: 600;
  font-size: 0.8rem;
}

.input-group {
  display: flex;
  justify-content: space-between;
}

.table-container {
  display: flex;
  justify-content: space-between;
  gap: 1.2rem;
  grid-column: span 3;
}
</style>
