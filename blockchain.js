var gl = require('./global.js');
var config = require('./config.js');

function queryBlockchain(result, cb) {
	let stdout = process.stdout;
	let web3 = result.web3;
	let addresses = web3.eth.accounts;
	let queryOptions = config.queryOptions;
	let maxTimeMillis = queryOptions.maxTimeMillis;
	let queryBatchRate = queryOptions.batchRate;
	let numQueriesPerBatch = queryOptions.numQueriesPerBatch;
	let timeBetweenBatches = Math.round(1000/queryBatchRate);
	let totalQueryRate = queryBatchRate*numQueriesPerBatch;

	let batchCount = 0;
	let elapsedTime = 0;
	let responseCount = 0;
	let requestCount = 0;
	let prevTime;
	let currentTime;

	function displayProgress() {
			stdout.write(`\r[INFO] Submitted ` + gl.NumSubmittedQueries + 
				` queries at ` + totalQueryRate + ` / s`);
	}

	function displaySummary() {
		console.log("[INFO] Actual query rate: " + 
			gl.NumSubmittedQueries/(gl.ActualQueryElapsedTime/1000) + 
			" / s averaged over " + (gl.ActualQueryElapsedTime/1000) + " s");
	}

	function handleGetTransactionResponse(err, res) {
		responseCount++;
		prevTime = currentTime;
		currentTime = (new Date()).getTime();
		gl.ActualQueryElapsedTime += currentTime - prevTime;
		if(err) { 
			numQueryErrors++;
		}
		if ((elapsedTime >= maxTimeMillis) && (responseCount == requestCount)) {
			displayProgress();
			console.log();
			displaySummary();
			clearInterval(intervalID);
			cb(null, result);
		}
	}

	function createAndExecuteBatch() {
		let batch = web3.createBatch();
		for (let i = 0; i < numQueriesPerBatch; i++) {
			requestCount++;
			let index = i*numQueriesPerBatch+requestCount-1;
			batch.add(web3.eth.getTransaction.request(gl.SentTxHashes[index], function(err, res) {
				handleGetTransactionResponse(err, res);
			}));
		}
		if (batchCount == 1) {
			prevTime = (new Date()).getTime();
			currentTime = prevTime;
		}
		batch.execute();
		gl.NumSubmittedQueries = batchCount*numQueriesPerBatch;
		if (batchCount % queryBatchRate === 0) {
			displayProgress();
		}
	}

	let intervalID = setInterval(function() {
		batchCount++;
		elapsedTime = batchCount*timeBetweenBatches;
		if (elapsedTime <= maxTimeMillis) {
			createAndExecuteBatch();
		} else if (timeBetweenBatches > maxTimeMillis) {
			console.log("Query rate not high enough for specified maxTimeMillis! Exiting...");
			clearInterval(intervalID);
			cb(null, result);
		}
	}, timeBetweenBatches);	
}

exports.Query = queryBlockchain;
