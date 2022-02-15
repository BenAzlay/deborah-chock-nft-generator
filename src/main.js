"use strict";

const path = require("path");
const isLocal = typeof process.pkg === "undefined";
const basePath = isLocal ? process.cwd() : path.dirname(process.execPath);
const fs = require("fs");
const sha1 = require(path.join(basePath, "/node_modules/sha1"));
const { createCanvas, loadImage } = require(path.join(
  basePath,
  "/node_modules/canvas"
));
const GIFEncoder = require('gifencoder');
const { encode } = require("punycode");
const buildDir = path.join(basePath, "/build");
const framesDir = path.join(basePath, "/frames");
console.log(path.join(basePath, "/src/config.js"));
const {
  format,
  baseUri,
  description,
  background,
  uniqueDnaTorrance,
  frameConfigurations,
  rarityDelimiter,
  shuffleFrameConfigurations,
  debugLogs,
  extraMetadata,
  successionNumber
} = require(path.join(basePath, "/src/config.js"));
const canvas = createCanvas(format.width, format.height);
const ctx = canvas.getContext("2d");
var metadataList = [];
var attributesList = [];
var dnaList = new Set();
const DNA_DELIMITER = '-';

const encoder = new GIFEncoder(format.width, format.height);

const buildSetup = () => {
  if (fs.existsSync(buildDir)) {
    fs.rmdirSync(buildDir, { recursive: true });
  }
  fs.mkdirSync(buildDir);
  fs.mkdirSync(path.join(buildDir, "/json"));
  fs.mkdirSync(path.join(buildDir, "/images"));
};

const getRarityWeight = (_str) => {
  let nameWithoutExtension = _str.slice(0, -4);
  var nameWithoutWeight = Number(
    nameWithoutExtension.split(rarityDelimiter).pop()
  );
  if (isNaN(nameWithoutWeight)) {
    nameWithoutWeight = 1;
  }
  return nameWithoutWeight;
};

const cleanDna = (_str) => {
  var dna = Number(_str.split(":").shift());
  return dna;
};

const cleanName = (_str) => {
  let nameWithoutExtension = _str.slice(0, -4);
  var nameWithoutWeight = nameWithoutExtension.split(rarityDelimiter).shift();
  return nameWithoutWeight;
};

const getElements = (path) => {
  return fs
    .readdirSync(path)
    .filter((item) => !/(^|\/)\.[^\/\.]/g.test(item))
    .map((i, index) => {
      return {
        id: index,
        name: cleanName(i),
        filename: i,
        path: `${path}${i}`,
        weight: getRarityWeight(i),
      };
    });
};

const framesSetup = (edition) => {
  const frames = {
    name: edition,
    elements: getElements(`${framesDir}/${edition}/`)
  };
  return frames;
};

const saveImage = (_editionCount) => {
  fs.writeFileSync(
    `${buildDir}/images/${_editionCount}.png`,
    canvas.toBuffer("image/png")
  );
};

const genColor = () => {
  let hue = Math.floor(Math.random() * 360);
  let pastel = `hsl(${hue}, 100%, ${background.brightness})`;
  return pastel;
};

const drawBackground = () => {
  ctx.fillStyle = genColor();
  ctx.fillRect(0, 0, format.width, format.height);
};

const addMetadata = (_dna, _number, _edition) => {
  let dateTime = Date.now();
  let tempMetadata = {
    dna: sha1(_dna),
    name: `#${_number}`,
    description: description,
    image: `${baseUri}/${_number}.gif`,
    edition: _edition,
    date: dateTime,
    ...extraMetadata,
    attributes: attributesList,
  };
  metadataList.push(tempMetadata);
  attributesList = [];
};

const addAttributes = (_frames, _editionCount, _edition) => {
  const value = _frames.map(frame => frame.name)
  attributesList.push({
    edition: _edition,
    number: _editionCount,
    value: value,
  });
};

const loadFrameImg = async (_frame) => {
  return new Promise(async (resolve) => {
    const image = await loadImage(`${_frame.path}`);
    resolve({ frame: _frame, loadedImage: image });
  });
};

const createGif = (_renderObjectArray, _editionCount, _edition) => {
  encoder.createReadStream().pipe(fs.createWriteStream(`${buildDir}/images/${_editionCount}.gif`));

  encoder.start();
  encoder.setRepeat(0);   
  encoder.setDelay(500);  
  encoder.setQuality(10); 
  _renderObjectArray.forEach((_renderObject) => {
    console.log("~ _renderObject", _renderObject)
    ctx.drawImage(_renderObject.loadedImage, 0, 0, format.width, format.height);
    encoder.addFrame(ctx);
  })
  encoder.finish()
  addAttributes(_renderObjectArray, _editionCount, _edition);
};

const constructFrameToDna = (_dna = '', _frames = []) => {
  console.log("~ _frames", _frames)
  let mappedDnaToFrames = _frames.map((frame, index) => {
    let selectedElement = frame.elements.find(
      (e) => e.id == cleanDna(_dna.split(DNA_DELIMITER)[index])
    );
    return {
      name: frame.name,
      selectedElement: selectedElement,
    };
  });
  return mappedDnaToFrames;
};

const getFramesFromDna = (_dna = '', _frames = []) => {
  const dnaFrames = [];
  _frames.elements.forEach((frame) => {
    if (_dna.includes(frame.filename)) {
      dnaFrames.push(frame)
    }
  })

  return dnaFrames;
};

const isDnaUnique = (_DnaList = new Set(), _dna = '') => {
  return !_DnaList.has(_dna);
};

const createDna = (_frames) => {
  const elements =[..._frames.elements];
  const images = [];
  var totalWeight = 0;
  
  while (images.length < successionNumber) {
    elements.forEach((element) => {
      totalWeight += element.weight;
    });
    // number between 0 - totalWeight
    let random = Math.floor(Math.random() * totalWeight);
    for (var i = 0; i < elements.length; i++) {
      // subtract the current weight from the random weight until we reach a sub zero value.
      random -= elements[i].weight;
      if (random < 0) {
        images.push(
          `${elements[i].id}:${elements[i].filename}`
        );
        elements.splice(i, 1)
        break;
      }
    }
  }
  return images.join(DNA_DELIMITER);
};

const writeMetaData = (_data) => {
  fs.writeFileSync(`${buildDir}/json/_metadata.json`, _data);
};

const saveMetaDataSingleFile = (_editionCount) => {
  let metadata = metadataList.find((meta) => meta.name.includes(_editionCount));
  console.log("~ metadata", metadata)
  debugLogs
    ? console.log(
        `Writing metadata for ${_editionCount}: ${JSON.stringify(metadata)}`
      )
    : null;
  fs.writeFileSync(
    `${buildDir}/json/${_editionCount}.json`,
    JSON.stringify(metadata, null, 2)
  );
};

function shuffle(array) {
  let currentIndex = array.length,
    randomIndex;
  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
}

const startCreating = async () => {
  let frameConfigIndex = 0;
  let editionCount = 1;
  let failedCount = 0;
  let abstractedIndexes = [];
  for (
    let i = 1;
    i <= frameConfigurations[frameConfigurations.length - 1].growEditionSizeTo;
    i++
  ) {
    abstractedIndexes.push(i);
  }
  if (shuffleFrameConfigurations) {
    abstractedIndexes = shuffle(abstractedIndexes);
  }
  debugLogs
    ? console.log("Editions left to create: ", abstractedIndexes)
    : null;
  while (frameConfigIndex < frameConfigurations.length) {
    // ! changes start here
    const frames = framesSetup(
      frameConfigurations[frameConfigIndex].edition
    );
    while (
      editionCount <= frameConfigurations[frameConfigIndex].growEditionSizeTo
    ) {
      let newDna = createDna(frames);
      console.log("~ newDna", newDna)
      if (isDnaUnique(dnaList, newDna)) {
        let dnaFrames = getFramesFromDna(newDna, frames);
        console.log("~ dnaFrames", dnaFrames)
        let loadedElements = [];

        dnaFrames.forEach((frame) => {
          loadedElements.push(loadFrameImg(frame));
        });

        await Promise.all(loadedElements).then((renderObjectArray) => {
          debugLogs ? console.log("Clearing canvas") : null;
          // ctx.clearRect(0, 0, format.width, format.height);
          createGif(renderObjectArray, editionCount, frames.name);
          addMetadata(newDna, editionCount, frames.name);
          saveMetaDataSingleFile(editionCount);
          console.log(
            `Created edition: ${abstractedIndexes[0]}, with DNA: ${sha1(
              newDna
            )}`
          );
        });
        dnaList.add(newDna);
        editionCount++;
        abstractedIndexes.shift();
      } else {
        console.log("DNA exists!");
        failedCount++;
        if (failedCount >= uniqueDnaTorrance) {
          console.log(
            `You need more frames or elements to grow your edition to ${frameConfigurations[frameConfigIndex].growEditionSizeTo} artworks!`
          );
          process.exit();
        }
      }
    }
    frameConfigIndex++;
  }
  // writeMetaData(JSON.stringify(metadataList, null, 2));
};

module.exports = { startCreating, buildSetup };
