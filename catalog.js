const fs = require('fs');

function convertToDecimal(str, base) {
    const digits = str.toLowerCase();
    const map = '0123456789abcdefghijklmnopqrstuvwxyz';
    let value = BigInt(0);
    for (let i = 0; i < digits.length; i++) {
        const digit = map.indexOf(digits[i]);
        if (digit >= base || digit === -1) {
            throw new Error(`Invalid digit '${digits[i]}' for base ${base}`);
        }
        value = value * BigInt(base) + BigInt(digit);
    }
    return value;
}


function lagrangeInterpolation(x, y, k) {
    let secret = BigInt(0);
    for (let i = 0; i < k; i++) {
        let xi = BigInt(x[i]);
        let yi = BigInt(y[i]);
        let num = BigInt(1);
        let den = BigInt(1);
        for (let j = 0; j < k; j++) {
            if (i !== j) {
                let xj = BigInt(x[j]);
                num *= -xj;
                den *= xi - xj;
            }
        }
        secret += yi * num / den;
    }
    return secret;
}

function getCombinations(arr, k) {
    const result = [];
    function combine(start, combo) {
        if (combo.length === k) {
            result.push([...combo]);
            return;
        }
        for (let i = start; i < arr.length; i++) {
            combo.push(arr[i]);
            combine(i + 1, combo);
            combo.pop();
        }
    }
    combine(0, []);
    return result;
}

function processFile(fileName) {
    const raw = fs.readFileSync(fileName);
    const json = JSON.parse(raw);
    const { n, k } = json["keys"];

    const allKeys = [];
    const x = [];
    const y = [];

    for (const key in json) {
        if (key === "keys") continue;
        const xi = parseInt(key);
        const base = parseInt(json[key]["base"]);
        const yValStr = json[key]["value"];
        try {
            const yi = convertToDecimal(yValStr, base);
            x.push(xi);
            y.push(yi);
            allKeys.push(xi);
        } catch (err) {
            console.warn(`Skipping invalid key ${key}: ${err.message}`);
        }
    }

    const indices = [...Array(x.length).keys()];
    const combos = getCombinations(indices, k);

    const secretMap = {}; 
    const keyUseCount = {}; 
    for (const combo of combos) {
        const subX = combo.map(i => x[i]);
        const subY = combo.map(i => y[i]);

        try {
            const secret = lagrangeInterpolation(subX, subY, k).toString();
            if (!secretMap[secret]) secretMap[secret] = { count: 0, keys: [] };
            secretMap[secret].count++;
            secretMap[secret].keys.push(...subX);

            subX.forEach(key => {
                keyUseCount[key] = (keyUseCount[key] || 0) + 1;
            });
        } catch (_) {
            continue;
        }
    }

    
    let finalSecret = null;
    let maxCount = 0;
    for (const [s, info] of Object.entries(secretMap)) {
        if (info.count > maxCount) {
            maxCount = info.count;
            finalSecret = s;
        }
    }
    const goodKeys = new Set(secretMap[finalSecret]?.keys || []);
    const badKeys = allKeys.filter(k => !goodKeys.has(k));

    console.log(`\nFile: ${fileName}`);
    console.log(`Secret (constant term): ${finalSecret}`);
    console.log(`Faulty or unused keys: [${badKeys.join(", ")}]`);
}

processFile('testcase1.json');
processFile('testcase2.json');
