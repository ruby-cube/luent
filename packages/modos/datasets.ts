import { MiscObj } from '@rue/types';
import { _genId } from './depot';
import { UID } from './types';

type _DatasetName = string;
type DataGroupName = string;
export type DataEntry = { id: UID };

export type RawDataset = {
    name: string,
    entries: MiscObj[],
}
export type Dataset = {
    name: string,
    entries: (DataEntry & MiscObj)[],
}

// export function getDatasetName(ClassOrInstance: ModelType | MiscObj) {
//     const isClass = ClassOrInstance instanceof Function;
//     const Class = isClass ? ClassOrInstance : null;
//     const instance = !isClass ? ClassOrInstance : null;
//     return Class?.name || instance.constructor.name;
// }

// export function getDatasetName(modelOrType: ModelType | Model | string) { //TODO: Clean up this function, make readable
//     if (typeof modelOrType === "string") return datasetNames.get(modelOrType) || modelOrType as string;
//     const isModelType = "make" in modelOrType && modelOrType.make instanceof Function;
//     const modelType = isModelType ? modelOrType : null;
//     const model = !isModelType ? <Model>modelOrType : null;
//     const modelName = modelType?.name || model?.modelName;
//     return datasetNames.get(modelName) || modelName as string;
// }

export function toDatasetName(modelName: string) {
    const datasetName = datasetNames.get(modelName);
    if (datasetName) return datasetName;
    return modelName;
}

export function toModelName(datasetName: string) {
    return modelNames.get(datasetName) || datasetName;
}

const datasetNames: Map<ModelName, DatasetName> = new Map();
const modelNames: Map<DatasetName, ModelName> = new Map();

export function registerDatasetName(datasetName: string, modelName: string) {
    datasetNames.set(modelName, datasetName);
    modelNames.set(datasetName, modelName);
}

type ModelName = string;
export type DatasetName = string;
export function registerDatasetNames(mappings: { [key: ModelName]: DatasetName }) {

}

// export function toDataset(modelTypeOrName: string | ModelType, dataset: MiscObj[]): Dataset {
//     const isModelType = typeof modelTypeOrName !== "string";
//     const modelType = isModelType ? modelTypeOrName : null;
//     const name = modelType ? getDatasetName(modelType) : modelTypeOrName as string;
//     return {
//         name,
//         entries: dataset
//     }
// }

export function toDataset(datasetName: string, dataset: MiscObj[]): RawDataset {
    return {
        name: datasetName,
        entries: dataset
    }
}


export const _dataGroups: Map<DataGroupName, Set<_DatasetName>> = new Map();
export function registerDataGroup(group: string, datasetNames: string[]) {
    let _datasets = _dataGroups.get(group);
    if (!_datasets) {
        _dataGroups.set(group, new Set(datasetNames))
    } else {
        for (const name of datasetNames) {
            _datasets.add(name);
        }
    }
}
export function getDataGroup(dataGroupName: string) {
    return _dataGroups.get(dataGroupName)
}



export function initiateDatasets(datasets: RawDataset[]) {
    for (const dataset of datasets) {
        for (const data of dataset.entries) {
            if (data.id == null) data.id = _genId();
        }
    }
    return datasets as Dataset[];
}

