/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const bytes = (s) => {
    return ~-encodeURI(s).split(/%..|./).length;
};

const { WorkloadModuleBase } = require('@hyperledger/caliper-core');

/**
 * Workload module for the benchmark round.
 */
class CreatePrivateAssetWorkload extends WorkloadModuleBase {
    /**
     * Initializes the workload module instance.
     */
    constructor() {
        super();
        this.txIndex = 0;
        this.chaincodeID = 'fixed-asset';
        this.asset = {};
        this.bytesize = 0;
    }

    /**
     * Initialize the workload module with the given parameters.
     * @param {number} workerIndex The 0-based index of the worker instantiating the workload module.
     * @param {number} totalWorkers The total number of workers participating in the round.
     * @param {number} roundIndex The 0-based index of the currently executing round.
     * @param {Object} roundArguments The user-provided arguments for the round from the benchmark configuration file.
     * @param {BlockchainInterface} sutAdapter The adapter of the underlying SUT.
     * @param {Object} sutContext The custom context object provided by the SUT adapter.
     * @async
     */
    async initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext) {
        await super.initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext);

        const args = this.roundArguments;
        this.bytesize = args.bytesize;

        this.asset = {
            docType: this.chaincodeID,
            content: '',
            creator: 'client' + this.workerIndex,
            bytesize: this.bytesize
        }

        const rand = 'random';
        let idx = 0;
        while (bytes(JSON.stringify(this.asset)) < this.bytesize) {
            const letter = rand.charAt(idx);
            idx = idx >= rand.length ? 0 : idx+1;
            this.asset.content = this.asset.content + letter;
        }
    }

    /**
     * Assemble TXs for the round.
     * @return {Promise<TxStatus[]>}
     */
    async submitTransaction() {
        const uuid = 'client' + this.workerIndex + '_' + this.bytesize + '_' + this.txIndex;
        this.asset.uuid = uuid;
        this.txIndex++;

        const myArgs = {
            chaincodeFunction: 'createPrivateAsset',
            chaincodeArguments: [uuid],
            transientMap: {content: JSON.stringify(this.asset)}
        }

        return this.sutAdapter.invokeSmartContract(this.chaincodeID, undefined, myArgs);
    }
}

/**
 * Create a new instance of the workload module.
 * @return {WorkloadModuleInterface}
 */
function createWorkloadModule() {
    return new CreatePrivateAssetWorkload();
}

module.exports.createWorkloadModule = createWorkloadModule;
