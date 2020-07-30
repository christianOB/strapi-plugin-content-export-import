export const convertModelAttributesToOptions = (model) => {
  return ['', ...Object.keys(model.schema.attributes)];
}