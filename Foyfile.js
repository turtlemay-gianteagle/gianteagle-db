const { task, fs } = require("foy");
const { Validator } = require("jsonschema");
const manifestJson = require("./manifest.json");
const schemaJson = require("turtlemay-cashier-db-schema/schema.json");

const BUILD_DIR = `${__dirname}/build`;
const DATA_DIR = `${__dirname}/data`;

task("watch", ["build"], async (ctx) => {
	fs.watchDir(DATA_DIR, async (evt, file) => {
		await ctx.run("validate");
		await ctx.run("build");
	});
});

task("build", ["clean", "validate"], async (ctx) => {
	await fs.outputJson(`${BUILD_DIR}/data.json`, buildData());
});

task("validate", async (ctx) => {
	const validator = new Validator();
	try {
		const result = validator.validate(buildData(), schemaJson);
		if (result.errors.length > 0) {
			const [err] = result.errors;
			throw new Error(`${err.property} ${err.message}`);
		}
	} catch (error) {
		console.error(error);
	}
});

task("clean", async (ctx) => {
	await fs.rmrf(BUILD_DIR);
});

function buildData() {
	return {
		name: manifestJson.name,
		version: manifestJson.version,
		organization: manifestJson.organization || undefined,
		items: readData(DATA_DIR),
	};
}

/**
 * @param {string} dataDir Read all files from this directory as JSON.
 * @returns {Array} An array of item data objects.
 */
function readData(dataDir) {
	const fileNames = fs.readdirSync(dataDir);
	const filePaths = fileNames.map((fileName) => `${dataDir}/${fileName}`);
	const fileContentsArr = filePaths.map((v) => fs.readFileSync(v, "utf-8"));
	const itemDataArrays = fileContentsArr.map((fileContents) =>
		JSON.parse(fileContents)
	);
	return [].concat(...itemDataArrays);
}
