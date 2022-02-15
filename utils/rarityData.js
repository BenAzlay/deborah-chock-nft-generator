"use strict";

const path = require("path");
const isLocal = typeof process.pkg === "undefined";
const basePath = isLocal ? process.cwd() : path.dirname(process.execPath);
const fs = require("fs");
const framesDir = `${basePath}/frames`;

console.log(path.join(basePath, "/src/config.js"));
const { frameConfigurations } = require(path.join(basePath, "/src/config.js"));

const { getElements } = require("../src/main.js");

// read json data
let rawdata = fs.readFileSync(`${basePath}/build/json/_metadata.json`);
let data = JSON.parse(rawdata);
let editionSize = data.length;

let rarityData = [];

// intialize frames to chart
frameConfigurations.forEach((config) => {
  let frames = config.framesOrder;

  frames.forEach((frame) => {
    // get elements for each frame
    let elementsForFrame = [];
    let elements = getElements(`${framesDir}/${frame.name}/`);
    elements.forEach((element) => {
      // just get name and weight for each element
      let rarityDataElement = {
        trait: element.name,
        chance: element.weight.toFixed(0),
        occurrence: 0, // initialize at 0
      };
      elementsForFrame.push(rarityDataElement);
    });

    // don't include duplicate frames
    if (!rarityData.includes(frame.name)) {
      // add elements for each frame to chart
      rarityData[frame.name] = elementsForFrame;
    }
  });
});

// fill up rarity chart with occurrences from metadata
data.forEach((element) => {
  let attributes = element.attributes;

  attributes.forEach((attribute) => {
    let traitType = attribute.trait_type;
    let value = attribute.value;

    let rarityDataTraits = rarityData[traitType];
    rarityDataTraits.forEach((rarityDataTrait) => {
      if (rarityDataTrait.trait == value) {
        // keep track of occurrences
        rarityDataTrait.occurrence++;
      }
    });
  });
});

// convert occurrences to percentages
for (var frame in rarityData) {
  for (var attribute in rarityData[frame]) {
    // convert to percentage
    rarityData[frame][attribute].occurrence =
      (rarityData[frame][attribute].occurrence / editionSize) * 100;

    // show two decimal places in percent
    rarityData[frame][attribute].occurrence =
      rarityData[frame][attribute].occurrence.toFixed(0) + "% out of 100%";
  }
}

// print out rarity data
for (var frame in rarityData) {
  console.log(`Trait type: ${frame}`);
  for (var trait in rarityData[frame]) {
    console.log(rarityData[frame][trait]);
  }
  console.log();
}
