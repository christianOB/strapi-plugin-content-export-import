import React, {useState, useEffect} from 'react';
import {Button, InputSelect} from "strapi-helper-plugin";
import {convertModelToOption} from "../../utils/convertOptions";
import {find, get, map} from 'lodash';
import {FieldRow, FileField, FormAction} from "./ui-components";
import {readLocalFile} from "../../utils/file";
import JsonDataDisplay from "../../components/JsonDataDisplay";
import {importData} from "../../utils/api";
import yaml from 'js-yaml';
import {csvParser} from "../../utils/csvParse";
import {Table, Select} from '@buffetjs/core';
import {CustomRow as Row} from '@buffetjs/styles';
import {convertModelAttributesToOptions} from "../../utils/convertAttributesToOptions";

const ImportForm = ({models}) => {
  const options = map(models, convertModelToOption);
  const [loading, setLoading] = useState(false);
  const [targetModelUid, setTargetModel] = useState(undefined);
  const [sourceFile, setSourceFile] = useState(null);
  const [source, setSource] = useState(null);
  const [sourceFields, setSourceFields] = useState([]);
  const [mappingObj, setMappingObj] = useState({});
  const [mappingTargetOptions, setMappingTargetOptions] = useState([]);
  const mappingHeaders = [
    {
      name: 'Source Field',
      value: 'sourceField'
    },
    {
      name: 'Target Field',
      value: ''
    }
  ];
  const CustomRow = ({ row }) => {
    const { sourceField } = row;
    const [val, setVal] = useState(mappingObj[sourceField]);
    const onRowTargetChange = (event) => {
      const _val = event.target.value;
      setVal(_val);
      // update global mapping when destination changed
      mappingObj[sourceField] = _val;
    };
    return (
      <Row>
        <td>
          <p> {sourceField} </p>
        </td>
        <td>
          <Select name={`select_dest_${sourceField}`} options={mappingTargetOptions} value={val}
                  onChange={onRowTargetChange}/>
        </td>
      </Row>
    );
  };

  useEffect(() => {
    if (!targetModelUid && models && models.length > 0) {
      setTargetModel(models[0].uid);
    }
  }, [models]);
  // set potential mappings when source or target model changes
  useEffect(() => {
    if (source) {
      const _mappingObj = {};
      const targetModel = find(models, (model) => model.uid === targetModelUid);
      const _mappingTargetOptions = convertModelAttributesToOptions(targetModel);
      setMappingTargetOptions(_mappingTargetOptions);
      const sourceObj = (Array.isArray(source)) ? source[0] : source;
      const fields = Object.keys(sourceObj).map((field) => {
        // default mappings to destination of same name
        _mappingObj[field] = (_mappingTargetOptions.includes(field)) ? field : '';
        return {'sourceField': field}
      });
      setMappingObj(_mappingObj);
      setSourceFields(fields);
    }
  }, [targetModelUid, source]);

  const onTargetModelChange = (event) => {
    setTargetModel(event.target.value);
  };

  const onSourceFileChange = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      setSource(null);
      setSourceFile(event.target.files[0])
    }
  };

  const upload = () => {
    if (!sourceFile) {
      strapi.notification.error("Please choose a source file first.");
      return;
    }
    setLoading(true);
    // add yaml and csv parse
    const filenameSplit = sourceFile.name.split('.');
    const ext = filenameSplit[filenameSplit.length - 1];
    let parser;
    switch (ext) {
      case 'csv':
        parser = csvParser;
        break;
      case 'yml':
      case 'yaml':
        parser = yaml.safeLoad;
        break;
      default:
        parser = JSON.parse;
    }
    readLocalFile(sourceFile, parser).then(setSource)
    .catch((error) => {
      strapi.notification.error(
        "Something wrong when uploading the file, please check the file and try again.");
      console.error(error)
    }).finally(() => {
      setLoading(false);
    })
  };

  const submit = () => {
    if (!targetModelUid) {
      strapi.notification.error("Please select a target content type!");
      return;
    }
    if (!source) {
      strapi.notification.error("Please choose a source file first.");
      return;
    }
    const model = find(models, (model) => model.uid === targetModelUid);
    setLoading(true);
    importData({
      targetModel: model.uid,
      source,
      mapping: mappingObj,
      kind: get(model, 'schema.kind'),
    }).then(() => {
      strapi.notification.success("Import succeeded!");
    }).catch((error) => {
      console.log(error);
      strapi.notification.error("Failed: " + error.message);
    }).finally(() => {
      setLoading(false);
    });
  };
  return (<div>
    <FieldRow>
      <label htmlFor="source">Content Source File</label>
      <FileField>
        <input id="source"
               name="source"
               accept={".json,.yaml,.yml,.csv"}
               type="file"
               onChange={onSourceFileChange}
        />
      </FileField>
    </FieldRow>
    {source
      ? (<JsonDataDisplay data={source}/>)
      : (<FormAction>
        <Button disabled={loading}
                onClick={upload}
                secondaryHotline>{loading ? "Please Wait..."
          : "Upload"}</Button>
      </FormAction>)
    }
    <FieldRow>
      <label htmlFor="target-content-type">Target Content Type</label>
      <InputSelect name="targetContentType"
                   id="target-content-type"
                   selectOptions={options}
                   value={targetModelUid}
                   onChange={onTargetModelChange}/>
    </FieldRow>
    <FieldRow>
      <label htmlFor="target-mapping">Mappings</label>
      <Table rows={sourceFields} headers={mappingHeaders} customRow={CustomRow}/>
    </FieldRow>
    <FormAction>
      <Button disabled={loading}
              onClick={submit}
              primary>{loading ? "Please Wait..." : "Import"}</Button>
    </FormAction>
  </div>)
};

export default ImportForm;
