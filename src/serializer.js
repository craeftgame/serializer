export default class Serializer {

    static matchSymbols(obj) {
        const regEx = /^\$\$Symbol:(.*)$/;

        return obj && obj.match && obj.match(regEx)
    }

    static replaceSymbol(key, obj) {
        const match = Serializer.matchSymbols(key);

        if (match) {
            obj[Symbol.for(match[1])] = obj[key];
            delete obj[key];
        }

        return obj;
    }

    static replaceSymbols(obj) {
        for (const key of Object.keys(obj)) {

            obj = Serializer.replaceSymbol(key, obj);

            if (obj[key] &&
                typeof obj[key] === "object") {
                Serializer.replaceSymbols(obj[key]);
            }
        }
    }

    static serialize(
        {
            obj,
            compress = false
        } = {}
    ) {
        const replacer = (name, value) => {
            if (typeof value === "symbol") {
                value = `$$Symbol:${Symbol.keyFor(value)}`
            }

            if (value &&
                typeof value === "object" &&
                Object.getOwnPropertySymbols(value).length > 0) {

                value = Object.assign({}, value);
                for (const symbol of Object.getOwnPropertySymbols(value)) {
                    value[`$$Symbol:${Symbol.keyFor(symbol)}`] = value[symbol]
                }
            }

            return value
        };

        return JSON.stringify(obj, replacer, compress ? 0 : 2);
    }

    static deserialize(json) {
        const reviver = (name, value) => {
            const valueMatches = Serializer.matchSymbols(value);
            return valueMatches ? Symbol.for(valueMatches[1]) : value
        };

        let obj = JSON.parse(json, reviver);

        Serializer.replaceSymbols(obj);

        return obj
    }
}
