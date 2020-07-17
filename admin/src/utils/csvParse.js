import Papa from 'papaparse';

export const csvParser = (str) => {
  const options = {
    header: true
  };
  const {data, errors, meta} = Papa.parse(str, options);
  console.log(meta)
  if (errors) {
    console.log(errors)
  }
  return data;
};
