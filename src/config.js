"use strict";

const path = require("path");
const isLocal = typeof process.pkg === "undefined";
const basePath = isLocal ? process.cwd() : path.dirname(process.execPath);
const { MODE } = require(path.join(basePath, "src/blendMode.js"));
const description =
  "This is the description of your NFT project, remember to replace this";
const baseUri = "ipfs://NewUriToReplace";

const layerConfigurations = [
  // White BG
  // {
  //   growEditionSizeTo: 34,
  //   layersOrder: [
  //     { name: "background_white" },
  //     { name: "face" }
  //   ],
  // }
  {
    growEditionSizeTo: 10,
    edition: 'love'
  }
  /*** TODO: change object struct to:
   * growEditionSizeTo: number,
   * edition: string => subfolder name i.e. love
   *  */
];

const shuffleLayerConfigurations = false; // TODO: set to true

const debugLogs = false;

const format = {
  width: 512,
  height: 512,
};

const background = {
  generate: true,
  brightness: "80%",
};

const extraMetadata = {
  creator: "Deborah Chock",
};

const rarityDelimiter = "#";

const uniqueDnaTorrance = 10000;

const preview = {
  thumbPerRow: 5,
  thumbWidth: 50,
  imageRatio: format.width / format.height,
  imageName: "preview.png",
};

module.exports = {
  format,
  baseUri,
  description,
  background,
  uniqueDnaTorrance,
  layerConfigurations,
  rarityDelimiter,
  preview,
  shuffleLayerConfigurations,
  debugLogs,
  extraMetadata
};
