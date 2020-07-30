export const createObjFromMappingObj = (source, mappingObj) => {
  const destObj = {};
  const mappingKeys = Object.keys(mappingObj)
  if (source && mappingKeys) {
    mappingKeys.forEach((key) => {
        const mappedKey = mappingObj[key]
        if (mappedKey) {
          destObj[mappedKey] = source[key];
        }
      });
  }
  return destObj;
};